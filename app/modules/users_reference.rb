module UsersReference
  def self.new_token_hr
    RestClient.proxy = ''
    token = JSON.parse(RestClient::Request.execute(method: :post,
                                                   url: 'https://hr.***REMOVED***.ru/ref-info/api/login',
                                                   headers: {
                                                     'X-Auth-Username' => ENV['NAME_USER_HR'],
                                                     'X-Auth-Password' => ENV['PASSWORD_USER_HR']
                                                   }))

    Rails.cache.write('token_hr', token['token'])
  end

  def self.user_find_by_tn(tab_num)
    token = Rails.cache.read('token_hr')

    RestClient.proxy = ''
    request = RestClient::Request.new(
      method: :get,
      url: "https://hr.***REMOVED***.ru/ref-info/api/emp?search=personnelNo==#{tab_num}",
      headers: {
        'X-Auth-Token' => token
      }
    )
    response = request.execute { |resp| resp }

    case response.code
    when 200
      return JSON.parse(response)['data'].first
    when 401
      return nil
    end
  end

  def self.info_user(tab_num)
    (0..1).each do |_|
      new_token_hr if Rails.cache.read('token_hr').blank?
      response = user_find_by_tn(tab_num)

      return response if response

      Rails.cache.delete('token_hr')
    end
    'Пользователь не найден'
  end

  def self.count_all_users
    (0..1).each do |_|
      new_token_hr if Rails.cache.read('token_hr').blank?
      token = Rails.cache.read('token_hr')

      RestClient.proxy = ''
      request = RestClient::Request.new(
        method: :get,
        url: "https://hr.***REMOVED***.ru/ref-info/api/emp",
        headers: {
          'X-Auth-Token' => token
        }
      )
      response = request.execute { |resp| resp }
      count_users = JSON.parse(response)['totalRecords']

      return count_users if response

      Rails.cache.delete('token_hr')
    end
    []
  end
end
