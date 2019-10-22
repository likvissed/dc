require 'signet/oauth_2/client'
require 'net/http'
require 'net/https'

class Users::CallbacksController <  DeviseController

  def registration_user
    session[:state] ||= Digest::MD5.hexdigest(rand.to_s)
    user_oauth
    redirect_to @client.authorization_uri.to_s
  end 

  def authorize_user
    if params[:error] || session[:state] != params[:state]
      set_flash_message(:alert, :error)
      redirect_to new_user_session_path
    else
      user_oauth
      @client.code = params['code']
      token = @client.fetch_access_token!
  
      uri = URI('https://auth-center.***REMOVED***.ru/api/module/main/login_info')
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true
  
      request = Net::HTTP::Post.new(uri.path, {'Content-Type' => 'application/json', 'Authorization' => "Bearer #{token['access_token']}"})
      response = http.request(request)
      
      user = JSON.parse(response.body)
      @user = User.find_by(tn: user['tn'])
  
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
    user_info = {
      client_id: ENV['CLIENT_ID'],
      client_secret: ENV['CLIENT_SECRET'],
      authorization_uri: 'https://auth-center.***REMOVED***.ru/oauth/authorize',
      token_credential_uri: 'https://auth-center.***REMOVED***.ru/oauth/token',
      response_type: 'code',
      state: session[:state],
      redirect_uri: "https://#{ENV['APPNAME']}.***REMOVED***.ru/users/callbacks/authorize_user",
    }

    @client = Signet::OAuth2::Client.new(user_info)
  end
end
