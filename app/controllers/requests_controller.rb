class RequestsController < DeviseController
  skip_before_action :authenticate_user!
  skip_after_action :verify_same_origin_request

  def index
    session['user_return_to'] = request_path

    if session['current_user_id'].blank?
      if session['was_in_request'].blank?
        redirect_to users_callbacks_registration_user_path
      else
        redirect_to user_session_path, flash: { notice: 'Пользователь не найден. Попробуйте авторизоваться повторно' }
      end
    end
  end

  def new
    service = Service.new
    # count_users = UsersReference.count_all_users || UserIss.count || || 8600
    current_user = User.find_by(tn: session['current_user_id'])

    render json: {
      service: service,
      system_requirement: SystemRequirement.all,
      services_name: Service.pluck(:name).map(&:downcase),
      current_user: current_user,
      presence_for_request: true
      # count_users: count_users
    }
  end

  def create
    user_tn_not_found if session['current_user_id'].blank? || params[:service].blank?
    session['user_return_to'] = root_path

    service = JSON.parse(params[:service])

    priority = service['priority'].to_i >= 80 ? 0 : 1
    contact = Contact.find_by(tn: session['current_user_id'])
    contact = Contact.create(tn: session['current_user_id']) if contact.blank?

    new_service = Service.new(
      number: '',
      dept: contact.dept,
      name: service['name'],
      time_work: 1, # Рабочее время (8/5)
      formular_type: false,
      descr: service['descr'],
      priority: priority,
      contact_1_id: contact.id,
      os: service['os'],
      component_key: service['component_key'],
      kernel_count: service['kernel_count'],
      frequency: service['frequency'],
      memory: service['memory'],
      disk_space: service['disk_space'],
      additional_data: service['additional_data'],
      consumer_fio: contact.info,
      presence_for_request: true
    )

    if new_service.save
      fields_for_send = new_service
                          .as_json
                          .slice('name', 'dept', 'time_work', 'formular_type', 'descr', 'priority', 'contact_1_id', 'os', 'component_key', 'kernel_count', 'frequency', 'memory', 'disk_space', 'additional_data')
                          .compact

      data = {}
      data['user_tn'] = session['current_user_id']
      # Массив таб.номеров исполнителей
      data['accs'] = ENV['ASTRAEA_FIELD_ACCS'].split(',')
      fields_for_send['source'] = 'dc'
      data['desc'] = fields_for_send.to_json.to_s

      response = JSON.parse(RestClient::Request.execute(method: :post,
                                                        proxy: nil,
                                                        url: ENV['ASTRAEA_URI'],
                                                        headers: {
                                                          'Content-Type' => 'application/json'
                                                        },
                                                        payload: data.to_json))

      case_id = ''
      if response.try(:[], 'case_id').present?
        case_id = response['case_id']
      else
        Rails.logger.info "Для сервера #{new_service.id} не создался кейс".red
        Rails.logger.info "Info: #{fields_for_send}".white
      end

      respond_to do |format|
        format.json { render json: { full_message: 'Заявка успешно создана', case_id: case_id }, status: :ok }
      end
    else

      respond_to do |format|
        format.json { render json: { full_message: new_service.errors.full_messages.join('. '), service: new_service }, status: 422 }
      end
    end
  end

  def successful
    @case_id = params['case_id']
  end

  def user_tn_not_found
    redirect_to user_session_path, flash: { notice: 'Пользователь не найден. Попробуйте авторизоваться повторно' }
  end
end
