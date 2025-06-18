## BigTable schema

```yaml
- row:
    key: w#${accountId}#${date}#${seasonId}#${episodeId}
    columns:
      - name: w:t # Watched video time ms
        type: number
- row:
    key: w#${accountId}#${date}
    columns:
      - name: w:s # last watched season id
        type: string
      - name: w:e # last watched episode id
        type: string
```
