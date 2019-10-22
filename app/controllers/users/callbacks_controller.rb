require 'oauth2'

class Users::CallbacksController <  DeviseController

  def registration_user

    session[:state] ||= Digest::MD5.hexdigest(rand.to_s)
    user_oauth
    redirect_to @client.auth_code.authorize_url(redirect_uri: @redirect_url, state: "#{session[:state]}")
  end 

  def authorize_user

    if params[:error] || session[:state] != params[:state]
      set_flash_message(:alert, :error)
      redirect_to new_user_session_path
    else

    user_oauth
    token = @client.auth_code.get_token("#{params[:code]}", redirect_uri: @redirect_url, headers: {'Authorization' => 'Basic some_password'})     

    response = token.get('/api/module/main/login_info')
    response.class.name

    user = JSON.parse(response.body)
    @user = User.find_by(tn: user['tn'] )

      if @user.nil?
        flash[:alert] = "Доступ запрещен"
        redirect_to new_user_session_path
      else
        session[:user_fullname] = user['fio']
        set_flash_message(:notice, :success)
        sign_in_and_redirect @user
      end
    end
  end

  def user_oauth
    @redirect_url = "https://#{ENV['APPNAME']}.***REMOVED***.ru/users/callbacks/authorize_user"

    @client = OAuth2::Client.new(ENV['CLIENT_ID'], ENV['CLIENT_SECRET'], site: 'https://auth-center.***REMOVED***.ru/')
  end
end
