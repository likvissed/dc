class ApplicationController < ActionController::Base
  layout :layout
  protect_from_forgery with: :exception

  before_action :authenticate_user!
  after_action :set_csrf_cookie_for_ng

  # Обрабтка случаев, когда у пользователя нет доступа на выполнение запрашиваемых действий
  rescue_from CanCan::AccessDenied do |exception|
    respond_to do |format|
      format.html do
        render_403
      end
      format.json { render json: { full_message: "Доступ запрещен" }, status: :forbidden }
    end
  end
  #rescue_from Exception, with: :render_500

  # Проверка, была ли нажата кнопка "Отмена".
  # Если да - редирект на указанный в переменной path путь
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

  # Создать html-строку с содержимым, зависящим от прав доступа пользователя
  # Запрос на данный метод генерирует директива addRecord, которая рендерит полученную строку.
  #
  # type    - тип контента, на который будет ссылаться ссылка
  #   (modal - модальное окно текущей страницы, page - новая страница)
  # object  - модель
  # params  - строка, содержащая атрибуты, необходиые для html тега (для разных типо разные атрибуты)
  def create_link_to_new_record(type, object, params)
    if can? :create, object
      if type == :modal
        "<button class='btn btn-primary btn-block' #{params}'>Добавить</button>"
      elsif type == :page
        "<form class='button_to' method='get' action='#{params}'>
          <input class='btn btn-primary btn-block' type='submit' value='Добавить'>
        </form>"
      end
    else
      ""
    end
  end

  # XSRF for angularjs
  def set_csrf_cookie_for_ng
    cookies['XSRF-TOKEN'] = form_authenticity_token if protect_against_forgery?
  end

  # Проверить, прошел ли дедлайн для тестового сервиса
  def check_service_deadline(service)
    service['deadline'].nil? ? false : Time.now.to_date > service['deadline']
  end

  protected

  # XSRF for angularjs
  def verified_request?
    super || valid_authenticity_token?(session, request.headers['X-XSRF-TOKEN'])
  end

  private

  # Чтобы после выхода редиректил на страницу входа
  def after_sign_out_path_for(resource_or_scope)
    new_user_session_path
  end

  # Куда перенаправлять после авторизации
  def after_sign_in_path_for(resource_or_scope)
    session["user_return_to"] || services_path
  end

  # Определяем, какой layout выводить: для входа в систему или основной
  def layout
    is_a?(Devise::SessionsController) ? "sign_in_app" : "application"
  end

end
