import { defineConfig } from 'orval';

export default defineConfig({
  api: {
    input: { target: 'http://localhost:8000/openapi.json' },
    output: {
      mode: 'tags-split',
      target: 'src/api/generated',
      schemas: 'src/api/generated/model',
      client: 'react-query',
      httpClient: 'axios',
      tsconfig: 'tsconfig.app.json',
      override: {
        mutator: {
          path: 'src/api/axios-instance.ts',
          name: 'customInstance',
        },
      },
    },
  },
});
