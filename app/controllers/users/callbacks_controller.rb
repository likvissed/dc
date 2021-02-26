class Users::CallbacksController < DeviseController
  def registration_user
    session[:state] ||= Digest::MD5.hexdigest(rand.to_s)

    redirect_to Authorize.get_url(session[:state])
  end

  def authorize_user
    return authorize_error if params[:error] || session[:state] != params[:state]
    session.delete(:state)

    token = Authorize.get_token(params[:code])
    return authorize_error unless token['access_token']

    user_info = Authorize.get_user(token['access_token'])
    return authorize_error unless user_info['tn']

    # Создание заявки
    session['current_user_id'] = user_info['tn']

    if session['user_return_to'] == request_path
      session['was_in_request'] = true

      redirect_to request_path
    end

    @user = User.find_by(tn: user_info['tn'])
    return authorize_error(:user_not_found) if @user.nil?

    session['user'] = user_info
    session['session_id'] = token['access_token']
    session['refresh_token'] = token['refresh_token']

    set_flash_message(:notice, :success)
    sign_in_and_redirect @user
  end

  def authorize_error(message = :failure)
    set_flash_message(:alert, message)
    redirect_to new_user_session_path
  end

  def refresh_token
    new_token = Authorize.get_new_token(session['refresh_token'])
    user_info = Authorize.get_user(new_token['access_token'])

    @user = User.find_by(tn: user_info['tn'])

    session['user'] = user_info
    session['session_id'] = new_token['access_token']
    session['refresh_token'] = new_token['refresh_token']

    sign_in_and_redirect @user
  end
end
