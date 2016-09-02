class ApplicationController < ActionController::Base
  layout :layout
  protect_from_forgery with: :exception

  before_action :authenticate_user!

  rescue_from CanCan::AccessDenied do |exception|
    respond_to do |format|
      format.html do
        render_403
      end
      format.json { render status: 403 }
    end
  end
  #rescue_from Exception, with: :render_500

  # Проверка, была ли нажата кнопка "Отмена"
  def check_for_cancel(path)
    redirect_to path if params[:cancel]
  end

  def render_404
    render file: "#{Rails.root}/public/404.html", status: 404, layout: false
  end

  def render_403
    render file: "#{Rails.root}/public/403.html", status: 403, layout: false
  end

  def render_500
    render file: "#{Rails.root}/public/500.html", status: 500, layout: false
  end

  private

  # Чтобы после выхода редиректил на страницу входа
  def after_sign_out_path_for(resource_or_scope)
    new_user_session_path
  end

  def after_sign_in_path_for(resource_or_scope)
    servers_path
  end

  # Определяем, какой layout выводить: для входа в систему или основной
  def layout
    is_a?(Devise::SessionsController) ? "sign_in_app" : "application"
  end

end
