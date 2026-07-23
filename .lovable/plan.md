## Метаболическая карта v2.8 — read-only проверка

Локальные файлы миграций совпадают с `main` на GitHub по SHA-256, кэш не используется. PR #2 учтён: в `20260723000200` есть `INSERT ... AS target` и `COALESCE(NULLIF(target."group", ''), EXCLUDED."group")` / `COALESCE(target.group_order, EXCLUDED.group_order)`.

### Отчёт

| Проверка | Результат | Комментарий | Риск |
|---|---|---|---|
| Каталог: всего кандидатов v2.8 | ✅ 72 | Точный подсчёт строк `VALUES` в `20260723000100` | нет |
| Каталог: подлежит вставке | ✅ 68 | 72 − 4 уже присутствующих | нет |
| Reuse: B12, FOLATE, LAC, HCY | ✅ | Все 4 найдены по `short_name`/`kdl_slug`; блок `IF NOT EXISTS` их пропустит | нет |
| ACAC не переименовывается | ✅ | В `VALUES` кода `ACAC` нет. В БД хранится `AcAc` (unit `ммоль/моль креатинина`, category `organic_acids_urine`) — не тронут. Комментарий строк 100–102 явно запрещает backfill | нет |
| `lab_results` не изменяется | ✅ | Ни `INSERT`/`UPDATE`/`DELETE`/`ALTER` на таблицу в файле нет | нет |
| `reference_ranges` / min/max не изменяется | ✅ | Таблица в файле не упомянута | нет |
| Pathways: 22 slug'а | ✅ | Строки 9–30, ровно 22 tuple'а | нет |
| `pathways.rules` не перезаписывается | ✅ | В `ON CONFLICT DO UPDATE SET` колонка `rules` отсутствует | нет |
| Сохранение group/group_order для существующих | ✅ | `AS target` + `COALESCE(NULLIF(target."group",''), EXCLUDED."group")` и `COALESCE(target.group_order, EXCLUDED.group_order)` — текущие непустые значения выживают | нет |
| Fallback `metabolic_v28` для новых | ✅ | Все 22 строки `VALUES` передают `'metabolic_v28'` + `group_order 100..121`; для 19 новых slug'ов target-значения NULL → COALESCE вернёт EXCLUDED | нет |
| Идемпотентность | ✅ | Каталог: `IF NOT EXISTS` в `DO`-блоке. Pathways: `ON CONFLICT (slug) DO UPDATE`. Повторный запуск не создаёт дубликатов | нет |
| GitHub main = local | ✅ | SHA-256 совпадают для обоих файлов, PR #2 в main | нет |
| `lab_results` = 302 | ✅ 302 | Совпадает с ожиданием | нет |
| `reference_ranges` = 247 | ✅ 247 | Совпадает с ожиданием | нет |
| Существующие пути (before-снимок) | ✅ | `amino_urea` group=`amino_defense`/order=5/rules=3; `energy_tca` group=`energy_substrates`/order=1/rules=3; `methylation` group=`micronutrients_methylation`/order=4/rules=4 — все три должны сохранить эти значения после миграции | нет |

### Ожидаемый after-снимок (для контрольной сверки)

- `lab_tests_catalog`: +68 новых кодов, 4 существующих без изменений.
- `pathways`: 22 slug'а в группе `metabolic_v28` активны; для `amino_urea`, `energy_tca`, `methylation` `group`/`group_order` **не меняются**, `rules_count` **не меняется** (3/3/4).
- `lab_results` = 302, `reference_ranges` = 247 — без изменений.

### Несоответствия
Не обнаружено. Все условия выполнены.

Останавливаюсь и жду команды «применяй миграции».
