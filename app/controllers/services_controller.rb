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
          :time_work,
          :contact_1_id,
          :contact_2_id
        ]

        @service = case params[:filter]
                     when 'crit'
                       Service.select(values).where(priority: "Критическая производственная задача")
                     when '712'
                       Service.select(values).where(dept: 712)
                     when '713'
                       Service.select(values).where(dept: 713)
                     when '***REMOVED***'
                       Service.select(values).where(dept: ***REMOVED***)
                     when '***REMOVED***'
                       Service.select(values).where(dept: ***REMOVED***)
                     when '200'
                       Service.select(values).where("dept LIKE ('2%')")
                     when 'notUivt'
                       Service.select(values).where("dept <> 712 and dept <> 713 and dept <> ***REMOVED*** and dept <> ***REMOVED***")
                     when 'virt***REMOVED***'
                       Service.select(values).where("environment LIKE ('%кластер производственной виртуализации VMware')")
                     when 'virt***REMOVED***'
                       Service.select(values).where("environment LIKE ('%система виртуализации о.***REMOVED***%')")
                     when 'virtNetLAN'
                       Service.select(values).where("environment LIKE ('%система производственной виртуализации ЛВС сетевой службы%')")
                     when 'virtNetDMZ'
                       Service.select(values).where("environment LIKE ('%система производственной виртуализации ДМЗ сетевой службы%')")
                     else
                       Service.select(values)
        end

        data = @service.as_json(
          include: {
            contact_1: { only: :info },
            contact_2: { only: :info }
          },
          except: [:created_at, :updated_at]).each do |s|
            s['priority']   = "#"
            s['time_work']  = short_time_work(s['time_work'])

            if !s.include?('contact_1') && !s.include?('contact_2')   # Если нет контактов
              s['contacts'] = nil
            elsif !s.include?('contact_1') && s.include?('contact_2') # Если есть только контакт 2
              s['contacts'] = s['contact_2']['info'].split(" ")[0]
            elsif !s.include?('contact_2')                            # Если есть только контакт 1
              s['contacts'] = s['contact_1']['info'].split(" ")[0]
            else                                                      # Если оба контакта
              s['contacts'] = s['contact_1']['info'].split(" ")[0] + ", " + s['contact_2']['info'].split(" ")[0]
            end

            s.delete('contact_1_id')
            s.delete('contact_2_id')

            s['scan']       = ""
            s['act']        = ""
            s['instr_rec']  = ""
            s['instr_off']  = ""
          end
        render json: data
      end
    end
  end

  def show
    respond_to do |format|
      # Массив с флагами отсутствия файлов скана/акта/инструкций
      missing_file = get_missing_files

      format.json do
        service = @service.as_json(except: [:id, :contact_1_id, :contact_2_id, :created_at, :updated_at])

        # Установить номер формуляра
        service['number'] = @service.get_service_number

        render json: {
          service:      service,
          networks:     @service.get_service_networks,
          storages:     @service.get_service_storages,
          missing_file: missing_file,
          contacts:     @service.get_contacts(:formular)
        }
      end
    end
  end

  def new
    respond_to do |format|
      format.html { @service = Service.new }
      format.json do
        get_services
        render json: { services: @services }
      end
    end
  end

  def create
    @service = Service.new(service_params)
    if @service.save
      flash[:notice] = "Данные добавлены."
      redirect_to action: :index
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
    respond_to do |format|
      format.html { render :edit }
      format.json do
        get_services

        missing_file              = {}
        missing_file[:scan]       = !@service.scan.exists?
        missing_file[:act]        = !@service.act.exists?
        missing_file[:instr_rec]  = !@service.instr_rec.exists?
        missing_file[:instr_off]  = !@service.instr_off.exists?

        render json: {
          missing_file: missing_file,
          service_networks: @service.service_networks.as_json(
            include: {
              service_port: {
                except: [:service_network_id, :ip, :host_class, :tcp_ports_2, :udp_ports_2, :created_at, :updated_at]
              }
            },
            except: [:service_id, :created_at, :updated_at]
          ),
          storage_systems: @service.storage_systems.as_json(except: [:service_id, :created_at, :updated_at]),
          services: @services,
          # current_name: @service.name, # Необходимо для исключения этого имени из списка родителей-сервисов
          parents: @service.service_dep_parents.as_json(
            include: { parent_service: { only: [:id, :name] } },
            only: :id
          )
        }
      end
    end
  end

  def update
    # В случае, если приходит пустая строка "Подключения СХД" и существует id записи, установить флаг на удаление = 1
    params[:service][:storage_systems_attributes].map do |attr|
      if !attr[1][:id].to_i.zero? && attr[1][:name].empty?
        attr[1][:_destroy] = 1
      end
    end

    if @service.update_attributes(service_params)
      flash[:notice] = "Данные изменены"
      redirect_to action: :index
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
      respond_to do |format|
        format.json { render json: { full_message: "Формуляр удален" }, status: :ok }
      end
    else
      respond_to do |format|
        format.json { render json: { full_message: "Ошибка. #{ @service.errors.full_messages.join(", ") }" }, status: :unprocessable_entity }
      end
    end
  end

  # Скачать файл (формуляр/акт/инструкцию по отключению/инструкцию по восстановлению)
  def download_file
    case params[:file]
      when 'scan'
        send_file @service.scan.path, filename: @service.scan_file_name, type: @service.scan_content_type, disposition: 'attachment'
      when 'act'
        send_file @service.act.path, filename: @service.act_file_name, type: @service.act_content_type, disposition: 'attachment'
      when 'instr_rec'
        send_file @service.instr_rec.path, filename: @service.instr_rec_file_name, type: @service.instr_rec_content_type, disposition: 'attachment'
      when 'instr_off'
        send_file @service.instr_off.path, filename: @service.instr_off_file_name, type: @service.instr_off_content_type, disposition: 'attachment'
      else
        render_404
    end
  end

  # Создать файл (формуляр/акт)
  def generate_file
    send_data @service.generate_rtf(params[:type]), filename: "#{@service.name}.rtf", type: "application/rtf", disposition: "attachment"
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
        @service.instr_rec.clear
      when 'instr_off'
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
        render json: { status: status, message: message, missing_file: get_missing_files(true) }
      end
    end
  end

  # Если у пользователя есть доступ, в ответ присылается html-код кнопки "Добавить" для создания новой записи
  # Запрос отсылается из JS файла при инициализации таблицы "Контакты"
  def link_to_new_record
    link = create_link_to_new_record :page, Service, "/services/new"
    respond_to do |format|
      format.json { render json: link }
    end
  end

  private

  def service_params
    params.require(:service).permit(
      :number,
      :dept,
      :name,
      :dept,
      :name,
      :descr,
      :priority,
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
      :cluster_ids,
      service_networks_attributes: [
        :id,
        :service_id,
        :segment,
        :vlan,
        :dns_name,
        :_destroy,
        service_port_attributes: [:id, :service_network_id, :local_tcp_ports, :local_udp_ports, :inet_tcp_ports, :inet_udp_ports, :host_class, :tcp_ports_2, :udp_ports_2, :_destroy]],
      storage_systems_attributes: [:id, :service_id, :name, :_destroy],
      service_dep_parents_attributes: [:id, :parent_id, :child_id, :_destroy]
    )
  end

  def get_services
    @services = Service.select(:id, :name)
  end

  def find_service_by_name
    @service = Service.find_by(name: params[:name])
  end

  def find_service_by_id
    @service = Service.find(params[:id])
  end

  def get_dept
    if (!params[:service][:contact_1_id].empty?)
      @contact = Contact.find(params[:service][:contact_1_id])
        params[:service][:dept] = @contact.dept
    elsif (!params[:service][:contact_2_id].empty?)
      @contact = Contact.find(params[:service][:contact_2_id])
      params[:service][:dept] = @contact.dept
    end
  end

  def short_time_work(time_work)
    case time_work
      when "Круглосуточно (24/7)"
        "24/7"
      when "Рабочее время (8/5)"
        "8/5"
      when "По запросу"
        "По запросу"
      else
        "Не определен"
    end
  end

  def get_missing_files(reload = false)
    @service.reload if reload

    missing_file              = {}
    missing_file[:scan]       = !@service.scan.exists?
    missing_file[:act]        = !@service.act.exists?
    missing_file[:instr_rec]  = !@service.instr_rec.exists?
    missing_file[:instr_off]  = !@service.instr_off.exists?

    missing_file
  end

end
