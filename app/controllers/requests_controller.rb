class RequestsController < DeviseController
  skip_before_action :authenticate_user!

  def index
    if params[:tn].present?
      redirect_to action: 'index', tn: params[:tn]
    else
      user_tn_not_found
    end
  end

  def new
    user_tn_not_found if session['current_user_id'].blank?
    Rails.logger.info "new_vm params: #{params.inspect}".red

    service = Service.new
    # count_users = UsersReference.count_all_users || UserIss.count || || 8600

    render json: {
      service: service,
      system_requirement: SystemRequirement.all,
      services_name: Service.pluck(:name)
      # count_users: count_users
    }
  end

  def create
    user_tn_not_found if session['current_user_id'].blank?

    service = JSON.parse(params[:service])

    priority = service['priority'].to_i >= 80 ? 0 : 1
    contact = Contact.find_by(tn: session['current_user_id'])
    contact = Contact.create(tn: session['current_user_id']) if contact.blank?

    new_service = Service.new(
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
      additional_data: service['additional_data']
    )

    if new_service.valid?
      new_service.save

      RestClient.proxy = ''
      response = JSON.parse(RestClient::Request.execute(method: :post,
                                                        url: ENV['ASTRAEA_URI'],
                                                        payload: {
                                                          user_tn: session['current_user_id'],
                                                          desc: new_service.to_json,
                                                          accs: ENV['ASTRAEA_FIELD_ACCS']
                                                        }))
      if response['case_id'].present?
        @case_id = response['case_id']

        render json: { full_message: 'Заявка успешно создана' }
      end
    else
      render json: new_service.errors.full_messages.join('. '), status: 422
    end
  end

  def user_tn_not_found
    redirect_to user_session_path, flash: { notice: 'Пользователь не найден. Попробуйте авторизоваться повторно' }
  end
end
