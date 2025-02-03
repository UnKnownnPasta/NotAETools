# Scheme of relicsdb.json

```json
{
  "relics": [],
  "primes": []
}
```

`relics` array:
| name   | rewards  | tokens  | vaulted |
|--------|----------|---------|---------|
| string | object[] | integer | boolean |

`rewards` array:
| item   | x2      | stock   | color   | rarity  | relicFrom |
|--------|---------|---------|---------|---------|-----------|
| string | boolean | integer | string  | float   | string    |

`primes` array:
| item   | x2      | stock   | color   | rarity  | relicFrom |
|--------|---------|---------|---------|---------|-----------|
| string | boolean | integer | string  | float   | string[]  |