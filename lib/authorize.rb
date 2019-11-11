require 'rest-client'

class Authorize
  class << self
    def get_url(state)
      "#{url_oauth[:authorization_uri]}?
                                  client_id=#{ENV['CLIENT_ID']}&
                                  response_type=code&
                                  redirect_uri=#{url_oauth[:redirect_uri]}&
                                  state=#{state}"
    end

    def get_token(code)
      RestClient.proxy = ''
      JSON.parse(RestClient::Request.execute(method: :post,
                                             url: url_oauth[:token_credential_uri],
                                             payload: {
                                               client_id: ENV['CLIENT_ID'],
                                               client_secret: ENV['CLIENT_SECRET'],
                                               grant_type: 'authorization_code',
                                               redirect_uri: url_oauth[:redirect_uri],
                                               code: code
                                             }))
    end

    def get_user(access_token)
      JSON.parse(RestClient::Request.execute(method: :post,
                                             url: 'https://auth-center.***REMOVED***.ru/api/module/main/login_info',
                                             headers: { 'Content-Type' => 'application/json', 'Authorization' => "Bearer #{access_token}" }))
    end

    def get_new_token(refresh_token)
      JSON.parse(RestClient::Request.execute(method: :post,
                                             url: url_oauth[:token_credential_uri],
                                             payload: {
                                               client_id: ENV['CLIENT_ID'],
                                               client_secret: ENV['CLIENT_SECRET'],
                                               grant_type: 'refresh_token',
                                               refresh_token: refresh_token
                                             }))
    end

    private

    def url_oauth
      {
        authorization_uri:    'https://auth-center.***REMOVED***.ru/oauth/authorize',
        token_credential_uri: 'https://auth-center.***REMOVED***.ru/oauth/token',
        redirect_uri:         "https://#{ENV['APPNAME']}.***REMOVED***.ru/users/callbacks/authorize_user"
      }
    end
  end
end
