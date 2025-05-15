declare namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      PORT: number;
      DATABASE_URL: string;
      JWT_SECRET: string;
    }
  }
  