#!/usr/bin/env python3
"""
Прогоняет несколько реальных позиций прайс-листа через боевой эндпоинт
POST /api/price-catalog/ingest и проверяет результат категоризации/канонизации
Библиотекаря против ожиданий.

В отличие от docs/PLANNING/test_librarian_real_data_round5.py (который тестировщик
гонял напрямую против Ollama на LXC 107, минуя приложение), этот скрипт бьёт в реальный
API целиком: очередь на fetchExistingCategories/fetchExistingCanonicalNames из БД,
сам вызов librarianService, ценовой guard rail, review-флаги — то есть проверяет
интеграцию, а не только качество модели.

Часть кейсов (over-merge «1 кирпич» vs «1/2 кирпича», текстовые ловушки «умный дом»,
«плитка на стенах», «короб») взята из того же прайса и тех же паттернов ошибок, что
исследовал тестировщик — но independent сеты, не копия его TEST_CASES.

Использование (на сервере, где слушает backend — обычно localhost:3000):
    python3 backend/scripts/ingest_real_test.py
Ключ (PRICE_CATALOG_INGEST_KEY) запрашивается один раз в начале, не хранится на диске.

ВАЖНО: каждый прогон создаёт реальные записи в price_catalog (source_detail
начинается с "real-test-") — после проверки результатов их стоит удалить, например:
    DELETE FROM price_catalog WHERE source_detail LIKE 'real-test-%';
"""

import getpass
import json
import time
import urllib.error
import urllib.request

BASE_URL = "http://localhost:3000/api/price-catalog/ingest"
TIMEOUT_S = 200  # с запасом над серверным OLLAMA_TIMEOUT_MS=180000


def post_ingest(api_key, payload):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        BASE_URL, data=data,
        headers={"Content-Type": "application/json", "X-API-Key": api_key},
        method="POST",
    )
    start = time.monotonic()
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT_S) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            return resp.status, body, time.monotonic() - start
    except urllib.error.HTTPError as e:
        try:
            body = json.loads(e.read().decode("utf-8"))
        except Exception:
            body = {"raw_error": str(e)}
        return e.code, body, time.monotonic() - start
    except Exception as e:
        return None, {"error": f"{type(e).__name__}: {e}"}, time.monotonic() - start


# Каждый кейс: (label, payload, checks) — checks получает распарсенную entry и context
# (словарь с canonical-именами предыдущих шагов для сверки merge/no-merge) и возвращает
# список (ok: bool, note: str)
CASES = []


def add_case(label, payload, checks):
    CASES.append({"label": label, "payload": payload, "checks": checks})


add_case(
    "1. База: демонтаж перегородки (1/2 кирпича), 535₽",
    {"source_work_name": "Демонтаж перегородок из кирпича (1/2 кирпича)", "unit": "кв.м",
     "price": 535, "price_qualifier": "exact", "source_type": "own", "source_detail": "real-test-1"},
    [
        lambda e, ctx: (e.get("model") is not None, f"model={e.get('model')} (ожидался не-null, т.е. не fallback)"),
        lambda e, ctx: ("Демонтаж" in (e.get("category") or ""), f"category='{e.get('category')}' (ожидалось содержит 'Демонтаж')"),
    ],
)

add_case(
    "2. Over-merge ловушка: (1 кирпич), 825₽ — НЕ должно слиться с шагом 1",
    {"source_work_name": "Демонтаж перегородок из кирпича (1 кирпич)", "unit": "кв.м",
     "price": 825, "price_qualifier": "exact", "source_type": "own", "source_detail": "real-test-2"},
    [
        lambda e, ctx: (e.get("model") is not None, f"model={e.get('model')}"),
        lambda e, ctx: (
            e.get("canonical_work_name") != ctx.get("case1_canonical"),
            f"canonical='{e.get('canonical_work_name')}' vs шаг1='{ctx.get('case1_canonical')}' "
            "(КРИТИЧНО: не должны совпадать — разный объём работы, цена +54%)",
        ),
    ],
)

add_case(
    "3. Синоним: 'демонтаж кирпичной перегородки в полкирпича', 535₽ — ДОЛЖНО слиться с шагом 1",
    {"source_work_name": "демонтаж кирпичной перегородки в полкирпича", "unit": "кв.м",
     "price": 535, "price_qualifier": "exact", "source_type": "own", "source_detail": "real-test-3"},
    [
        lambda e, ctx: (e.get("model") is not None, f"model={e.get('model')}"),
        lambda e, ctx: (
            e.get("canonical_work_name") == ctx.get("case1_canonical"),
            f"canonical='{e.get('canonical_work_name')}' vs шаг1='{ctx.get('case1_canonical')}' (ожидалось совпадение)",
        ),
    ],
)

add_case(
    "4. 'Умный дом': монтаж KNX, 1500₽ — не должен уйти в обычную электрику",
    {"source_work_name": "Монтаж систем умного дома (KNX)", "unit": "шт.",
     "price": 1500, "price_qualifier": "exact", "source_type": "own", "source_detail": "real-test-4"},
    [
        lambda e, ctx: (e.get("model") is not None, f"model={e.get('model')}"),
        lambda e, ctx: (
            e.get("category") == "Электромонтажные работы (Умный дом)",
            f"category='{e.get('category')}' (ожидалось ровно 'Электромонтажные работы (Умный дом)')",
        ),
    ],
)

add_case(
    "5. Текстовая ловушка: плитка на стенах — должна уйти в 'Плиточные работы', не в малярку",
    {"source_work_name": "Облицовка стен плиткой (стандартного размера 150-300 мм)", "unit": "кв.м",
     "price": 950, "price_qualifier": "exact", "source_type": "own", "source_detail": "real-test-5"},
    [
        lambda e, ctx: (e.get("model") is not None, f"model={e.get('model')}"),
        lambda e, ctx: (
            e.get("category") == "Плиточные работы",
            f"category='{e.get('category')}' (ожидалось ровно 'Плиточные работы')",
        ),
    ],
)

add_case(
    "6. Текстовая ловушка: врезка в вент.короб — должна уйти в 'Вентиляционные работы'",
    {"source_work_name": "Врезка в вентиляционный короб", "unit": "шт.",
     "price": 250, "price_qualifier": "exact", "source_type": "own", "source_detail": "real-test-6"},
    [
        lambda e, ctx: (e.get("model") is not None, f"model={e.get('model')}"),
        lambda e, ctx: (
            e.get("category") == "Вентиляционные работы",
            f"category='{e.get('category')}' (ожидалось ровно 'Вентиляционные работы')",
        ),
    ],
)


def main():
    api_key = getpass.getpass("PRICE_CATALOG_INGEST_KEY (ввод скрыт): ").strip()
    if not api_key:
        print("Пустой ключ — выход.")
        return

    ctx = {}
    total_ok = 0
    total_checks = 0
    print()

    for case in CASES:
        print(f"=== {case['label']} ===")
        status, body, elapsed = post_ingest(api_key, case["payload"])

        if status not in (200, 201):
            print(f"  ❌ HTTP {status}: {json.dumps(body, ensure_ascii=False)[:500]}")
            print(f"  Время: {elapsed:.1f}s\n")
            continue

        entry = (body.get("data") or {}).get("price_catalog") or {}

        print(f"  HTTP {status} | время: {elapsed:.1f}s | dedup: {(body.get('data') or {}).get('deduplicated')}")
        print(f"  category='{entry.get('category')}'")
        print(f"  canonical_work_name='{entry.get('canonical_work_name')}'")
        print(f"  model={entry.get('model')} | prompt_version={entry.get('prompt_version')}")
        print(f"  category_review_flag={entry.get('category_review_flag')}")
        if entry.get("category_review_details"):
            print(f"  category_review_details={json.dumps(entry['category_review_details'], ensure_ascii=False)}")

        for check in case["checks"]:
            ok, note = check(entry, ctx)
            total_checks += 1
            if ok:
                total_ok += 1
            print(f"  {'✅' if ok else '❌'} {note}")

        # Сохраняем canonical_work_name первого кейса для сверки в шагах 2 и 3
        if case["label"].startswith("1."):
            ctx["case1_canonical"] = entry.get("canonical_work_name")

        print()
        time.sleep(1)

    print("=" * 60)
    print(f"ИТОГО: {total_ok}/{total_checks} проверок пройдено")
    if total_ok < total_checks:
        print("Есть расхождения с ожиданием — пришли весь вывод целиком для разбора.")


if __name__ == "__main__":
    main()
