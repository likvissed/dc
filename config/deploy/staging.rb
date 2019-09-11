set :application, 'staging-dc'
set :deploy_to, "/var/www/#{fetch(:application)}"
set :branch, 'develop'
