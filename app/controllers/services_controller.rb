class ServicesController < ApplicationController
  
  load_and_authorize_resource
  
  before_action { |ctrl| ctrl.check_for_cancel services_path }
  before_action :find_service_by_name,  only: [:edit, :update]
  before_action :find_service_by_id,    only: [:show, :destroy, :download_file, :generate_file, :destroy_file]
  before_action :get_dept,              only: [:create, :update]

  def index
    respond_to do |format|
      format.html { render :index }
      format.json do
        values = [
          :id,
          :number,
          :dept,
          :name,
          :priority,
          :deadline,
          :time_work,
          :contact_1_id,
          :contact_2_id,
          :exploitation,
          :scan_file_name,
          :act_file_name,
          :instr_rec_file_name,
          :has_instr_rec,
          :instr_off_file_name,
          :has_instr_off
        ]

        filter = case params[:filter]
                   when 'crit'
                     "priority = 'Критическая производственная задача'"
                   when '712'
                     "dept = 712"
                   when '713'
                     "dept = 713"
                   when '***REMOVED***'
                     "dept = ***REMOVED***"
                   when '***REMOVED***'
                     "dept = ***REMOVED***"
                   when '200'
                     "dept LIKE ('2%')"
                   when 'notUivt'
                     "dept <> 712 and dept <> 713 and dept <> ***REMOVED*** and dept <> ***REMOVED***"
                   when 'virt***REMOVED***'
                     "environment LIKE ('%кластер производственной виртуализации VMware')"
                   when 'virt***REMOVED***'
                     "environment LIKE ('%система виртуализации о.***REMOVED***%')"
                   when 'virtNetLAN'
                     "environment LIKE ('%система производственной виртуализации ЛВС сетевой службы%')"
                   when 'virtNetDMZ'
                     "environment LIKE ('%система производственной виртуализации ДМЗ сетевой службы%')"
                   else
                     ""
        end

        self_dept = UserIss.find_by(tn: current_user.tn).dept
        contact = Contact.find_by(tn: current_user.tn)

        @service = if current_user.has_any_role? :uivt, :not_uivt
                     Service.where.not(dept: nil).where(dept: self_dept).or(Service.where.not(contact_2: nil).where(contact_2: contact)).select(values).order(:id).where(filter).includes(:contact_1, :contact_2)
                   else
                     Service.select(values).order(:id).where(filter).includes(:contact_1, :contact_2)
                   end

        now   = Time.now.to_date
        data  = @service.as_json(
          include: {
            contact_1: { only: :info },
            contact_2: { only: :info }
          },
          except: [:created_at, :updated_at]).each do |s|
            # Привести "Режим функционирования" к сокращенному формату
            s[:time_work]  = short_time_work(s['time_work'])

            # Флаги
            s[:flags] = {}
            # Приоритет функционирования сервиса
            s[:flags][:priority] = s['priority']
            # Для тестовых затач проверить дату дедлайна (true - если now > deadline)
            # s[:flags][:deadline] = if s['deadline'].nil?
            #                          false
            #                        else
            #                          now > s['deadline']
            #                        end
            s[:flags][:deadline] = check_service_deadline s
            s[:flags][:exploitation] = s['exploitation']

            # Передать только фамилию у ответственных
            if !s.include?('contact_1') && !s.include?('contact_2')   # Если нет контактов
              s[:contacts] = nil
            elsif !s.include?('contact_1') && s.include?('contact_2') # Если есть только контакт 2
              s[:contacts] = s['contact_2']['info'].split(' ')[0]
            elsif !s.include?('contact_2')                            # Если есть только контакт 1
              s[:contacts] = s['contact_1']['info'].split(' ')[0]
            else                                                      # Если оба контакта
              s[:contacts] = s['contact_1']['info'].split(' ')[0] + ', ' + s['contact_2']['info'].split(' ')[0]
            end

            s[:missing_file] = get_missing_files(s)
            # Иконки наличия/отсутствия файлов скана/акта/инструкций
            s[:scan]      = if s[:missing_file][:scan]
                              '<i class="fa fa-times"></i>'
                            else
                              '<i class="fa fa-check"></i>'
                            end

            s[:act]       = if s[:missing_file][:act]
                              '<i class="fa fa-times"></i>'
                            else
                              '<i class="fa fa-check"></i>'
                            end

            s[:instr_rec] = if s[:missing_file][:instr_rec] && !s['has_instr_rec']
                              '<i class="fa fa-times"></i>'
                            else
                              '<i class="fa fa-check"></i>'
                            end

            s[:instr_off] = if s[:missing_file][:instr_off] && !s['has_instr_off']
                              '<i class="fa fa-times"></i>'
                            else
                              '<i class="fa fa-check"></i>'
                            end

            s.delete('contact_1_id')
            s.delete('contact_2_id')
            s.delete('missing_file')
          end
        render json: data
      end
    end
  end

  def show
    respond_to do |format|
      format.json do
        # Массив с флагами отсутствия файлов скана/акта/инструкций
        missing_file  = get_missing_files(@service)
        service       = @service.as_json(except: [:contact_1_id, :contact_2_id, :created_at, :updated_at])

        # Установить номер формуляра
        service[:number]    = @service.get_service_number
        # Проверить, прошел ли дедлайн для тестового сервиса
        deadline            = check_service_deadline service
        # Установить время дедлайна для приоритета "Тестирование и отладка"
        service[:deadline]  = I18n.l(@service.deadline, format: :long) unless @service.deadline.nil?

        service[:antivirus] = @service.antivirus.present? ? I18n.t("activerecord.attributes.service.antiviri.#{@service.antivirus}") : ''

        fio = @service.consumer_fio.split
        date = @service.updated_at || @service.created_at

        last_update = fio.blank? ? date.strftime("%d.%m.%Y %H:%M") : "#{date.strftime("%d.%m.%Y %H:%M")} (#{fio[0]} #{fio[1][0]}.#{fio[2][0]}.)"
        service[:last_update] = last_update

        render json: {
          service:      service,
          deadline:     deadline,
          networks:     @service.get_service_networks,
          ports:        @service.get_ports,
          storages:     @service.get_service_storages,
          missing_file: missing_file,
          contacts:     @service.get_contacts(:formular),
          hosting:      @service.cluster.as_json(only: [:id, :name]),
          parents:      @service.parents.as_json(only: :name)
        }
      end
    end
  end

  def new
    respond_to do |format|
      format.html { @service = Service.new }
      format.json do
        get_services
        render json: { services: @services, priorities: Service.priorities.keys }
      end
    end
  end

  def create
    user = UserIss.find_by(tn: current_user.tn)
    contact = Contact.find_by(tn: current_user.tn)

    if contact.blank?
      contact = Contact.new(
        tn: user.tn,
        info: user.fio,
        dept: user.dept,
        work_num: user.tel
      )
      contact.save
    end

    # Заменить названия месяцев для корректной работы ActiveRecord
    params[:service][:deadline] = regexp_date(params[:service][:deadline])
    params[:service][:consumer_fio] = current_user.info

    @service = Service.new(service_params)
    if @service.save

      #  Если Основной ответственный и Вторичный контакт не задан, то добавить в основного - текущего пользователя
      unless @service.contact_1 || @service.contact_2
        Contact.find(contact.id).first_contacts << @service
        @service.update(dept: user.dept)
      end

      flash[:notice] = "Данные добавлены."
      redirect_to action: :index, id: @service.id
    else
      @service.errors.delete(:scan)
      @service.errors.delete(:act)
      @service.errors.delete(:instr_rec)
      @service.errors.delete(:instr_off)

      flash.now[:alert] = @service.errors.full_messages.join(". ")
      render :new
    end
  end

  def edit
    authorize! :edit, @service

    respond_to do |format|
      format.html
      format.json do
        get_services

        render json: {
          missing_file: get_missing_files(@service),
          file_flags: get_file_flags(@service),
          service_networks: @service.service_networks.as_json(
            include: {
              service_port: {
                except: [:service_network_id, :host_class, :tcp_ports_2, :udp_ports_2, :created_at, :updated_at]
              },
            },
            except: [:ip, :service_id, :created_at, :updated_at]
          ),
          storage_systems:  @service.storage_systems.as_json(except: [:service_id, :created_at, :updated_at]),
          services:         @services,
          priorities:       Service.priorities.keys,
          priority:         @service.priority,
          deadline:         @service.deadline,
          parents:          @service.service_dep_parents.as_json(
            include: { parent_service: { only: [:id, :name] } },
            only: :id
          ),
          max_time_rec: @service.max_time_rec,
          time_recovery: @service.time_recovery,
          time_after_failure: @service.time_after_failure,
          time_after_disaster: @service.time_after_disaster,
          values_service: @service
        }
      end
    end
  end

  def update
    authorize! :update, @service
    # В случае, если приходит пустая строка "Подключения СХД" и существует id записи, установить флаг на удаление = 1
    params[:service][:storage_systems_attributes].to_unsafe_h.map do |attr|
      if !attr[1][:id].to_i.zero? && attr[1][:name].empty?
        attr[1][:_destroy] = 1
      end
    end

    # Заменить названия месяцев для корректной работы ActiveRecord
    params[:service][:deadline] = regexp_date(params[:service][:deadline])
    params[:service][:consumer_fio] = current_user.info

    if @service.update_attributes(service_params)
      flash[:notice] = "Данные изменены"
      redirect_to action: :index, id: @service.id
    else
      @service.errors.delete(:scan)
      @service.errors.delete(:act)
      @service.errors.delete(:instr_rec)
      @service.errors.delete(:instr_off)

      flash.now[:alert] = @service.errors.full_messages.join(". ")
      render :edit
    end
  end

  def destroy
    if @service.destroy
      conclusion_of_all_connections_for_service

      respond_to do |format|
        format.json { render json: { full_message: "Формуляр удален" }, status: :ok }
      end
    else
      respond_to do |format|
        format.json { render json: { full_message: "Ошибка. #{ @service.errors.full_messages.join(", ") }" }, status:
          :unprocessable_entity }
      end
    end
  end

  # Скачать загруженные файлы (формуляр/акт/инструкцию по отключению/инструкцию по восстановлению)
  # Для инструкций дополнительно проверяется роль пользователя. Разрешено только для :admin и :head
  def download_file
    case params[:file]
      when 'scan'
        send_file @service.scan.path, filename: @service.scan_file_name, type: @service.scan_content_type,
                  disposition: 'attachment'
      when 'act'
        send_file @service.act.path, filename: @service.act_file_name, type: @service.act_content_type, disposition:
          'attachment'
      when 'instr_rec'
        if current_user.has_any_role? :admin, :head, :uivt
          send_file @service.instr_rec.path, filename: @service.instr_rec_file_name, type: @service
                                                                                             .instr_rec_content_type,
                    disposition: 'attachment'
        else
          render_404
        end
      when 'instr_off'
        if current_user.has_any_role? :admin, :head, :uivt
          send_file @service.instr_off.path, filename: @service.instr_off_file_name, type: @service
                                                                                             .instr_off_content_type,
                    disposition: 'attachment'
        else
          render_404
        end
      else
        render_404
    end
  end

  # Создать файл (формуляр/акт)
  def generate_file
    send_data @service.generate_rtf(params[:type]), filename: "#{@service.name}.rtf", type: "application/rtf",
              disposition: "attachment"
  end

  # Удалить файл (формуляр/акт/инструкцию по отключению/инструкцию по восстановлению)
  def destroy_file

    status  = :ok
    message = "Файл удален."

    case params[:file]
      when 'scan'
        @service.scan.clear
      when 'act'
        @service.act.clear
      when 'instr_rec'
        @service.has_instr_rec = false
        @service.instr_rec.clear
      when 'instr_off'
        @service.has_instr_off = false
        @service.instr_off.clear
      else
        status  = :not_found
        message = "Файл не найден."
    end

    unless status != :not_fount && @service.save
      status  = :unprocessable_entity
      message = "Ошибка. #{ @service.errors.full_messages.join(", ") }"
    end

    respond_to do |format|
      format.json do
        render json: { status: status, message: message, missing_file: get_missing_files(@service, true), file_flags:
          get_file_flags(@service) }
      end
    end
  end

  # Если у пользователя есть доступ, в ответ присылается html-код кнопки "Добавить" для создания новой записи
  # Запрос отсылается из JS файла при инициализации таблицы "Сервисы"
  def link_to_new_record
    link = create_link_to_new_record :page, Service, "/services/new"
    respond_to do |format|
      format.json { render json: link }
    end
  end

  private

  # Разрешенные параметры
  def service_params
    params.require(:service).permit(
      :number,
      :dept,
      :name,
      :descr,
      :priority,
      :deadline,
      :time_work,
      :max_time_rec,
      :contact_1_id,
      :contact_2_id,
      :environment,
      :os,
      :component_key,
      :kernel_count,
      :frequency,
      :memory,
      :disk_space,
      :hdd_speed,
      :network_speed,
      :additional_require,
      :backup_manual,
      :recovery_manual,
      :value_backup_data,
      :storage_time,
      :store_copies,
      :backup_volume,
      :backup_window,
      :time_recovery,
      :duplicate_ps,
      :raid,
      :bonding,
      :other,
      :resiliency,
      :time_after_failure,
      :disaster_rec,
      :time_after_disaster,
      :antivirus,
      :firewall,
      :uac_app_selinux,
      :szi,
      :internet,
      :tcp_ports,
      :udp_ports,
      :inet_tcp,
      :inet_udp,
      :type_mon,
      :service_mon,
      :hardware_mon,
      :security_mon,
      :additional_data,
      :scan,
      :act,
      :has_instr_rec,
      :instr_rec,
      :has_instr_off,
      :instr_off,
      :exploitation,
      :comment,
      :name_monitoring,
      :consumer_fio,
      :cluster_ids,
      service_networks_attributes: [
        :id,
        :service_id,
        :segment,
        :vlan,
        :dns_name,
        :_destroy,
        service_port_attributes: [:id, :service_network_id, :local_tcp_ports, :local_udp_ports, :inet_tcp_ports,
                                  :inet_udp_ports, :host_class, :tcp_ports_2, :udp_ports_2, :_destroy]],
      storage_systems_attributes: [:id, :service_id, :name, :_destroy],
      service_dep_parents_attributes: [:id, :parent_id, :child_id, :_destroy]
    )
  end

  # Получить список всех сервисов
  def get_services
    @services = Service.select(:id, :name)
  end

  # Найти сервис по полю name
  def find_service_by_name
    @service = Service.find_by(name: params[:name])
  end

  # Найти сервис по полю id
  def find_service_by_id
    @service = Service.find(params[:id])
  end

  # Получить отдел (по ответственным), с которым связан сервис
  def get_dept
    if (!params[:service][:contact_1_id].empty?)
      @contact = Contact.find(params[:service][:contact_1_id])
        params[:service][:dept] = @contact.dept
    elsif (!params[:service][:contact_2_id].empty?)
      @contact = Contact.find(params[:service][:contact_2_id])
      params[:service][:dept] = @contact.dept
    end
  end

  # Получить аббревиатуру для поля "Режим гарантированной доступности"
  def short_time_work(time_work)
    case time_work
      when Service.time_works.keys[0] # "Круглосуточно (24/7)"
        "24/7"
      when Service.time_works.keys[1] # "Рабочее время (8/5)"
        "8/5"
      when Service.time_works.keys[2] # "По запросу"
        "По запросу"
      else
        "Не определен"
    end
  end

  # Получить объект, содержащий флаги, которые показывают отсутствующие файлы
  def get_missing_files(service, reload = false)
    missing_file = {}

    # Если передали экземпляр класса
    if service.class == 'Service'
      service.reload if reload

      missing_file[:scan]       = !service.scan.exists?
      missing_file[:act]        = !service.act.exists?
      missing_file[:instr_rec]  = !service.instr_rec.exists?
      missing_file[:instr_off]  = !service.instr_off.exists?
    else
      missing_file[:scan]       = !service['scan_file_name'].present?
      missing_file[:act]        = !service['act_file_name'].present?
      missing_file[:instr_rec]  = !service['instr_rec_file_name'].present?
      missing_file[:instr_off]  = !service['instr_off_file_name'].present?
    end

    missing_file
  end

  def get_file_flags(service)
    flag = {}

    flag[:scan]      = false
    flag[:act]       = false
    flag[:instr_rec] = service.has_instr_rec
    flag[:instr_off] = service.has_instr_off

    flag
  end

  # Заменить названия месяцев для корректной работы ActiveRecord
  def regexp_date(date)
    unless date.nil?
      date.gsub!(/января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря/,
                          'января'    => 'Jan',
                          'февраля'   => 'Feb',
                          'марта'     => 'Mar',
                          'апреля'    => 'Apr',
                          'мая'       => 'May',
                          'июня'      => 'Jun',
                          'июля'      => 'Jul',
                          'августа'   => 'Aug',
                          'сентября'  => 'Sep',
                          'октября'   => 'Oct',
                          'ноября'    => 'Nov',
                          'декабря'   => 'Dec')
      date.to_date
    end
  end

  # Проверить, прошел ли срок дедайна для тестового сервиса
  def check_deadline(deadline)
    if deadline.nil?
      false
    else
      Time.now.to_date > deadline
    end
  end

  def conclusion_of_all_connections_for_service
    service_all_data = {}
    service_all_data['service'] = @service.inspect
    service_all_data['service_networks'] = @service.service_networks.each(&:inspect)
    service_all_data['storage_systems'] = @service.storage_systems.each(&:inspect)
    service_all_data['service_dep_parents'] = @service.service_dep_parents.each(&:inspect)
    service_all_data['parents'] = @service.parents.each(&:inspect)
    service_all_data['service_dep_childs'] = @service.service_dep_childs.each(&:inspect)
    service_all_data['childs'] = @service.childs.each(&:inspect)
    service_all_data['service_hostings'] = @service.service_hostings.each(&:inspect)
    service_all_data['contact_1'] = @service.contact_1
    service_all_data['contact_2'] = @service.contact_2

    Rails.logger.info "Формуляр удален: #{service_all_data}".red
  end
end
