Rails.application.routes.draw do

  root 'servers#index'

  constraints name: /[^\/]+/ do
    get   '/servers/:name/edit', to: 'servers#edit'
    patch '/servers/:name', to: 'servers#update'

    get   '/server_types/:name/edit', to: 'server_types#edit'
    patch '/server_types/:name', to: 'server_types#update'

    get   '/detail_types/:name/edit', to: 'detail_types#edit'
    patch '/detail_types/:name', to: 'detail_types#update'

    get   '/server_parts/:name/edit', to: 'server_parts#edit'
    patch '/server_parts/:name', to: 'server_parts#update'

    resources 'clusters'
  end

  resources 'servers', except: [:edit, :update]
  resources 'server_types', except: [:edit, :update]
  resources 'detail_types', except: [:edit, :update]
  resources 'server_parts', except: [:edit, :update]

  # The priority is based upon order of creation: first created -> highest priority.
  # See how all your routes lay out with "rake routes".

  # You can have the root of your site routed with "root"
  # root 'welcome#index'

  # Example of regular route:
  #   get 'products/:id' => 'catalog#view'

  # Example of named route that can be invoked with purchase_url(id: product.id)
  #   get 'products/:id/purchase' => 'catalog#purchase', as: :purchase

  # Example resource route (maps HTTP verbs to controller actions automatically):
  #   resources :p'oducts

  # Example resource route with options:
  #   resources :products do
  #     member do
  #       get 'short'
  #       post 'toggle'
  #     end
  #
  #     collection do
  #       get 'sold'
  #     end
  #   end

  # Example resource route with sub-resources:
  #   resources :products do
  #     resources :comments, :sales
  #     resource :seller
  #   end

  # Example resource route with more complex sub-resources:
  #   resources :products do
  #     resources :comments
  #     resources :sales do
  #       get 'recent', on: :collection
  #     end
  #   end

  # Example resource route with concerns:
  #   concern :toggleable do
  #     post 'toggle'
  #   end
  #   resources :posts, concerns: :toggleable
  #   resources :photos, concerns: :toggleable

  # Example resource route within a namespace:
  #   namespace :admin do
  #     # Directs /admin/products/* to Admin::ProductsController
  #     # (app/controllers/admin/products_controller.rb)
  #     resources :products
  #   end
end
