Rails.application.routes.draw do
  devise_for :users
  
  devise_scope :user do
    get 'users/callbacks/registration_user', to: 'users/callbacks#registration_user'
    get 'users/callbacks/authorize_user', to: 'users/callbacks#authorize_user'

    root 'services#index'
  end

  constraints name: /[^\/]+/ do
    get   '/servers/:inventory_num/edit',  to: 'servers#edit'
    patch '/servers/:inventory_num',       to: 'servers#update'

    get   '/server_types/:name/edit', to: 'server_types#edit'
    patch '/server_types/:name',      to: 'server_types#update'

    get   '/detail_types/:name/edit', to: 'detail_types#edit'

    get   '/server_parts/:name/edit', to: 'server_parts#edit'

    get   '/clusters/:name/edit',     to: 'clusters#edit'

    get   '/node_roles/:name/edit',   to: 'node_roles#edit'

    get   '/services/:name/edit',     to: 'services#edit'
    patch '/services/:name',          to: 'services#update'
  end

  constraints tn: /\d+/ do
    get     '/contacts/:tn/edit',         to: 'contacts#edit'
    patch   '/contacts/:tn',              to: 'contacts#update'
    delete  '/contacts/:tn',              to: 'contacts#destroy'

    get     '/department_heads/:tn/edit', to: 'department_heads#edit'
    patch   '/department_heads/:tn',      to: 'department_heads#update'
    delete  '/department_heads/:tn',      to: 'department_heads#destroy'
  end

  resources :users do
    get 'role', to: 'users#role', on: :collection
  end

  resources :servers,       except: [:edit, :update] do
    get 'link/new_record', to: 'servers#link_to_new_record', on: :collection
  end
  resources :server_types,  except: [:edit, :update] do
    get 'link/new_record', to: 'server_types#link_to_new_record', on: :collection
  end
  resources :detail_types,  except: [:edit, :show] do
    get 'link/new_record', to: 'detail_types#link_to_new_record', on: :collection
  end
  resources :server_parts,  except: [:edit] do
    get 'link/new_record', to: 'server_parts#link_to_new_record', on: :collection
  end

  resources :clusters,    except: [:edit] do
    get 'link/new_record', to: 'clusters#link_to_new_record', on: :collection
  end
  resources :node_roles,  except: [:edit, :show] do
    get 'link/new_record', to: 'node_roles#link_to_new_record', on: :collection
  end

  resources :contacts,          except: [:edit, :update, :show, :destroy] do
    get 'link/new_record', to: 'contacts#link_to_new_record', on: :collection
  end
  resources :department_heads,  except: [:edit, :update, :show, :destroy] do
    get 'link/new_record', to: 'department_heads#link_to_new_record', on: :collection
  end
  resources :services,          except: [:edit, :update] do
    member do
      get     '/download/:file',  to: 'services#download_file'  # Скачивание файлов формуляров
      get     '/generate/:type',  to: 'services#generate_file'  # Генерация формуляра/акта
      delete  '/destroy/:file',   to: 'services#destroy_file'   # Удаление файлов формуляра
    end

    collection do
      get 'link/new_record', to: 'services#link_to_new_record'   # Отрендерить ссылку на новую запись, если у пользователя есть права (через json)
    end
  end

  # get 'main_settings/index'
  resources :main_settings, only: [:index]

  get '*unmatched_route', to: 'application#render_404'

end
