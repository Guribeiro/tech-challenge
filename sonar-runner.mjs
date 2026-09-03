import 'dotenv/config';
import scanner from 'sonarqube-scanner';

// Validação defensiva para garantir que a variável foi carregada do .env
if (!process.env.SONAR_TOKEN) {
  console.error('❌ ERRO: A variável SONAR_TOKEN não foi encontrada no arquivo .env!')
  process.exit(1)
}

const hostUrl = process.env.SONAR_HOST_URL || 'http://localhost:9000'
const token = process.env.SONAR_TOKEN

scanner(
  {
    serverUrl: hostUrl,
    token: token,
    options: {
      'sonar.host.url': hostUrl,
      'sonar.token': token, // ✅ Garante o envio do token para o scanner interno
      'sonar.projectKey': 'oficina-mecanica',
      'sonar.projectName': 'Oficina Mecanica API',
      'sonar.projectVersion': '1.0.0',
      'sonar.sources': 'src',
      'sonar.tests': 'src',
      'sonar.test.inclusions': '**/*.spec.ts, **/*.test.ts, **/*.e2e-spec.ts',
      
      // ✅ Apenas uma declaração limpa para excluir arquivos globais da análise estrutural
      'sonar.exclusions': '**/node_modules/**, **/dist/**, **/generated/**, **/seed.ts',
      
      // ✅ Corrigido para varrer recursivamente com '**/' em vez de '*'
      'sonar.coverage.exclusions': [
        '**/main.ts',
        '**/*.module.ts',
        '**/*.dto.ts',
        '**/*.entity.ts',
        '**/factories/**/*',
        '**/database/**/*', 
        '**/prisma/**/*',   
        '**/infra/**/*',    
        '**/tests/**/*',    
        '**/*.spec.ts',
        '**/*.test.ts',
        '**/*.e2e-spec.ts',
      ].join(','),

      'sonar.javascript.lcov.reportPaths': 'coverage/lcov.info',
      'sonar.sourceEncoding': 'UTF-8',
    },
  },
  () => process.exit(0)
);