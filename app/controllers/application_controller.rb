class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception

  # Проверка, была ли нажата кнопка "Отмена"
  def check_for_cancel(path)
    redirect_to path if params[:cancel]
  end
end
