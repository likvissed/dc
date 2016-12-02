class Users::CallbacksController < Devise::OmniauthCallbacksController

  skip_before_action :verify_authenticity_token

  def open_id_***REMOVED***
    user_params = request.env["omniauth.auth"].info

    @user = User.find_by(tn: user_params.tn)
    if @user.nil?
      flash[:alert] = "Доступ запрещен"
      redirect_to new_user_session_path
    else
      session[:user_fullname] = user_params.fullname

      sign_in_and_redirect @user, event: :authentication
      set_flash_message(:notice, :success)
    end
  end

  def failure
    flash[:alert] = "Ошибка авторизации. Обратитесь к администратору по тел. ***REMOVED***"
    redirect_to new_user_session_path
  end

end