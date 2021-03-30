pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                sh 'echo ${ACCESS_TOKEN}| docker login docker.pkg.github.com -u chatzich --password-stdin'
               sh 'docker build . --tag docker.pkg.github.com/verifiable-pdfs/validator-widget/validator-widget-full:${BRANCH_NAME}'
               sh 'docker push docker.pkg.github.com/verifiable-pdfs/validator-widget/validator-widget-full:${BRANCH_NAME}'
            }
        }
    }
}
