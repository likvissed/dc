# config valid only for current version of Capistrano

# version gem capistrano
lock '3.11.0'

set :rbenv_ruby, '2.2.1'

set :application, 'dc'
server 'dc', user: 'deployer', roles: %w[web app db]

# configuration git
set :repo_url, '***REMOVED***'

set :linked_files, %w[config/database.yml config/secrets.yml .env]
set :linked_dirs, %w[log tmp/pids tmp/cache vendor/bundle public/system]

set :use_sudo, false
set :deploy_via, :remote_cache
set :passenger_restart_with_touch, true

set :rbenv_map_bins, %w[rake gem bundle ruby rails]

SSHKit.config.command_map[:rake]  = 'bundle exec rake'
SSHKit.config.command_map[:rails] = 'bundle exec rails'

# namespace :deploy do
#   desc 'Restart Passenger app'
#   task :restart do
#     on roles(:app), in: :sequence, wait: 5 do
#       execute :touch, release_path.join('tmp/restart.txt')
#     end
#   end
# end

desc 'Reset database and add default data'
task :seed do
  on primary fetch(:migration_role) do
    within release_path do
      with rails_env: fetch(:rails_env) do
        execute :rake, 'db:reset'
      end
    end
  end
end

after 'deploy:publishing', 'deploy:restart' 