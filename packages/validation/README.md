# @carsharing/validation

Константы минимальной и максимальной длины строковых полей для backend, web и mobile.

| Константа | Min | Max |
|-----------|-----|-----|
| `USER_DISPLAY_NAME` | 3 | 120 |
| `USER_PASSWORD` | 8 | 255 |
| `LOGIN` | 3 | 200 |
| `LOGIN_PASSWORD` | 1 | 255 |
| `EMAIL` | — | 254 |
| `PHONE` | — | 16 |
| `GEOZONE_NAME` | 1 | 255 |
| `GEOZONE_RULES_JSON` | — | 16384 |
| `TARIFF_NAME` | 1 | 1000 |
| `TARIFF_PRICE` (число) | 0 | 10000 |
| `VIOLATION_DESCRIPTION` | 1 | 1000 |
| `NOTICE_SUBJECT` | 1 | 500 |
| `NOTICE_MESSAGE` | 1 | 2000 |
| `CAR_STRING` | 1 | 255 |
| `CAR_FUEL` (%) | 1 | 100 |

Flutter: `apps/mobile/app/lib/shared/validation/field_limits.dart` — держать в sync.
