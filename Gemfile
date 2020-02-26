source 'https://rubygems.org'

git_source(:github) do |repo_name|
  repo_name = "#{repo_name}/#{repo_name}" unless repo_name.include?("/")
  "https://github.com/#{repo_name}.git"
end
gem 'listen'
gem 'paperclip'
gem 'paperclip-i18n'
# Paginator
gem 'kaminari'
# Devise authentication
gem 'devise'
# Omniauth authentication
gem 'omniauth'
# Access manager
gem 'cancancan'
gem 'dotenv-rails'
# Roles
gem 'rolify'
# Strip attributes for input data
gem 'strip_attributes'
# DataTables
# gem 'jquery-datatables-rails'
# MySQL
gem 'mysql2'
# Icons
gem 'font-awesome-sass'
# Twitter Bootstrap
gem 'bootstrap-sass'
# Simple form
gem 'simple_form'
# haml slim
gem 'haml-rails'
gem 'slim'
# i18n
gem 'rails-i18n'
# Bundle edge Rails instead: gem 'rails', github: 'rails/rails'
gem 'rails', '5.2.0'
# Use SCSS for stylesheets
gem 'sass-rails', '~> 5.0'
# Use Uglifier as compressor for JavaScript assets
gem 'uglifier', '>= 1.3.0'
# For color console
gem 'awesome_print'
# For authorization
gem 'rest-client'
# search forms 
gem 'ransack'
# angular selected
gem 'angular-ui-select-rails'

# Use CoffeeScript for .coffee assets and views
# gem 'coffee-rails', '~> 4.1.0'
# See https://github.com/rails/execjs#readme for more supported runtimes
# gem 'therubyracer', platforms: :ruby

# Use jquery as the JavaScript library
gem 'jquery-rails'
# Turbolinks makes following links in your web application faster. Read more: https://github.com/rails/turbolinks
# gem 'turbolinks'
# Build JSON APIs with ease. Read more: https://github.com/rails/jbuilder
gem 'jbuilder', '~> 2.0'
# bundle exec rake doc:rails generates the API under doc/api.
gem 'sdoc', '~> 0.4.0', group: :doc

# Use ActiveModel has_secure_password
# gem 'bcrypt', '~> 3.1.7'

# Use Unicorn as the app server
# gem 'unicorn'

# Use Capistrano for deployment
# gem 'capistrano-rails', group: :development

group :development, :test do
  # Call 'byebug' anywhere in the code to stop execution and get a debugger console
  gem 'byebug'
  # Testing
  gem 'rspec-rails'
  # Factory
  # gem 'factory_girl_rails'
  gem 'factory_bot_rails'
  # Formatting rspec
  gem 'fuubar'
  # gem 'capybara'
  # gem 'capybara-webkit'
end

group :test do
  gem 'database_cleaner'
end

group :development do
  # Access an IRB console on exception pages or by using <%= console %> in views
  gem 'web-console', '~> 2.0'

  # Spring speeds up development by keeping your application running in the background. Read more: https://github.com/rails/spring
  gem 'spring'
  # Rails panel (for Chrome inspector)
  gem 'meta_request'
  # View errors
  gem 'better_errors'
  # Quiet assets

  # Capistrano
  gem 'capistrano', require: false
  gem 'capistrano-rails', require: false
  gem 'capistrano-bundler', require: false
  gem 'capistrano-rbenv', require: false
  gem 'capistrano-passenger', require: false
  #gem 'unicorn'

  gem 'ed25519'
  gem 'bcrypt_pbkdf' 

  # rule
  gem 'rubocop', require: false
end
