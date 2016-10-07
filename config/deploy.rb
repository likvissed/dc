# config valid only for current version of Capistrano
lock '3.5.0'

#set :application, 'my_app_name'
#set :repo_url, 'git@example.com:me/my_repo.git'

# Default branch is :master
# ask :branch, `git rev-parse --abbrev-ref HEAD`.chomp

# Default deploy_to directory is /var/www/my_app_name
# set :deploy_to, '/var/www/my_app_name'

# Default value for :scm is :git
# set :scm, :git

# Default value for :format is :airbrussh.
# set :format, :airbrussh

# You can configure the Airbrussh format using :format_options.
# These are the defaults.
# set :format_options, command_output: true, log_file: 'log/capistrano.log', color: :auto, truncate: :auto

# Default value for :pty is false
# set :pty, true

# Default value for :linked_files is []
# set :linked_files, fetch(:linked_files, []).push('config/database.yml', 'config/secrets.yml')

# Default value for linked_dirs is []
# set :linked_dirs, fetch(:linked_dirs, []).push('log', 'tmp/pids', 'tmp/cache', 'tmp/sockets', 'public/system')

# Default value for default_env is {}
# set :default_env, { path: "/opt/ruby/bin:$PATH" }

# Default value for keep_releases is 5
# set :keep_releases, 5

#namespace :deploy do

#  after :restart, :clear_cache do
#    on roles(:web), in: :groups, limit: 3, wait: 10 do
      # Here we can do anything such as:
      # within release_path do
      #   execute :rake, 'cache:clear'
      # end
#    end
#  end

#end

set :application,     'dc_app'
#set :user, 'deployer'

set :ssh_options, {
  keys:               %w(/home/ravil/.ssh/id_rsa),
  forward_agent:      false,
  user:               'deployer'
}

# Repo details
set :rbenv_ruby,      '2.2.1'
set :repo_url,        '/var/repos/dc_app.git'
set :scm,             :git
set :branch,          'master'
set :rbenv_map_bins,  %w{rake gem bundle ruby rails}

set :keep_releases,   20

#set :local_user, 'deployer'
#set :rails_env, 'production'
set :deploy_via,      :remote_cache
set :use_sudo,        false
set :passenger_restart_with_touch, true
#set :default_stage, 'staging'

set :linked_files,    %w{config/database.yml}
set :linked_dirs,     %w{log tmp/pids tmp/cache vendor/bundle public/system}

role :web,  'dc'
role :app,  'dc'
role :db,   'dc'

SSHKit.config.command_map[:rake]  = "bundle exec rake" #8
SSHKit.config.command_map[:rails] = "bundle exec rails"

set :passenger_restart_with_touch, true

namespace :deploy do
  desc "Restart Passenger app"
  task :restart do
    on roles(:app), in: :sequence, wait: 5 do
      execute :touch, release_path.join("tmp/restart.txt")
    end
  end
end

desc "Reset database and add default data"
task :seed do
  on primary fetch(:migration_role) do
    within release_path do
      with rails_env: fetch(:rails_env) do
        execute :rake, 'db:reset'
      end
    end
  end
end

after 'deploy', 'deploy:cleanup'
after 'deploy:publishing', 'deploy:restart'