import 'dotenv/config';
import scanner from 'sonarqube-scanner';

scanner(
  {
    serverUrl: process.env.SONAR_HOST_URL || 'http://localhost:9000',
    token: process.env.SONAR_TOKEN,
    options: {
      'sonar.projectKey': 'oficina-mecanica',
      'sonar.projectName': 'Oficina Mecanica API',
      'sonar.projectVersion': '1.0.0',
      'sonar.sources': 'src',
      'sonar.tests': 'src',
      'sonar.test.inclusions': '**/*.spec.ts, **/*.test.ts, **/*.e2e-spec.ts',
      'sonar.exclusions': [
          '**/node_modules/**',
          '**/dist/**',
          'src/main.ts',
          'src/**/*.module.ts',
          'src/**/*.dto.ts',
          'src/**/*.entity.ts',
          'src/generated/**',
          'src/**/factories/**',
          'src/**/*.spec.ts',
          'src/**/*.test.ts',
          'src/**/*.e2e-spec.ts'
        ].join(','),
      'sonar.exclusions': '**/node_modules/**, **/dist/**, src/generated/**, **/seed.ts',
      'sonar.javascript.lcov.reportPaths': 'coverage/lcov.info',
      'sonar.sourceEncoding': 'UTF-8',
    },
  },
  () => process.exit()
);