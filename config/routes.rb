Rails.application.routes.draw do

  #root 'servers#index'
  devise_scope :user do
    root 'devise/sessions#new'
  end
  devise_for :users#, controllers: { registrations: 'users/registrations' }

  constraints name: /\w+/ do
    get   '/users/:name/edit',  to: 'users#edit'
    patch '/users/:name',       to: 'users#update'
  end

  constraints name: /[^\/]+/ do

    get   '/servers/:name/edit',      to: 'servers#edit'
    patch '/servers/:name',           to: 'servers#update'

    get   '/server_types/:name/edit', to: 'server_types#edit'
    patch '/server_types/:name',      to: 'server_types#update'

    get   '/detail_types/:name/edit', to: 'detail_types#edit'
    patch '/detail_types/:name',      to: 'detail_types#update'

    get   '/server_parts/:name/edit', to: 'server_parts#edit'
    patch '/server_parts/:name',      to: 'server_parts#update'

    get   '/clusters/:name/edit',     to: 'clusters#edit'
    patch '/clusters/:name',          to: 'clusters#update'

    get   '/node_roles/:name/edit',   to: 'node_roles#edit'
    patch '/node_roles/:name',        to: 'node_roles#update'

  end

  resources :users,         except: [:edit, :update]
  resources :servers,       except: [:edit, :update]
  resources :server_types,  except: [:edit, :update]
  resources :detail_types,  except: [:edit, :update, :show]
  resources :server_parts,  except: [:edit, :update]
  resources :clusters,      except: [:edit, :update]
  resources :node_roles,    except: [:edit, :update, :show]

  resources :contacts

  get '*unmatched_route', to: 'application#render_404'

end
