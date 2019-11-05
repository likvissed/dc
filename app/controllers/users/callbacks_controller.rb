require 'rest-client'

class Users::CallbacksController < DeviseController
  def registration_user
    session[:state] ||= Digest::MD5.hexdigest(rand.to_s)
    user_oauth
    redirect_to "#{@user_info[:authorization_uri]}?
                                      client_id=#{@user_info[:client_id]}&
                                      client_secret=#{@user_info[:client_secret]}&
                                      response_type=#{@user_info[:response_type]}&
                                      redirect_uri=#{@user_info[:redirect_uri]}"
  end

  def authorize_user
    if params[:error] || session[:state] != params[:state]

      set_flash_message(:alert, :error)
      redirect_to new_user_session_path
    else
      user_oauth
      RestClient.proxy = ''
      token = JSON.parse(RestClient::Request.execute(method: :post,
                                                     url: @user_info[:token_credential_uri],
                                                     payload: {
                                                       client_id: @user_info[:client_id],
                                                       client_secret: @user_info[:client_secret],
                                                       grant_type: @user_info[:grant_type],
                                                       redirect_uri: @user_info[:redirect_uri],
                                                       code: params[:code]
                                                     }))

      user = JSON.parse(RestClient::Request.execute(method: :post,
                                                    url: 'https://auth-center.***REMOVED***.ru/api/module/main/login_info',
                                                    headers: { 'Content-Type' => 'application/json', 'Authorization' => "Bearer #{token['access_token']}" }))
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

  private

  def user_oauth
    @user_info = {
      client_id: ENV['CLIENT_ID'],
      client_secret: ENV['CLIENT_SECRET'],
      authorization_uri: 'https://auth-center.***REMOVED***.ru/oauth/authorize',
      token_credential_uri: 'https://auth-center.***REMOVED***.ru/oauth/token',
      response_type: 'code',
      grant_type: 'authorization_code',
      redirect_uri: "https://#{ENV['APPNAME']}.***REMOVED***.ru/users/callbacks/authorize_user"
    }
  end
end
