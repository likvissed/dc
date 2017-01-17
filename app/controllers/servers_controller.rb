class ServersController < ApplicationController

  load_and_authorize_resource

  before_action { |ctrl| ctrl.check_for_cancel servers_path }
  before_action :find_server_by_name, only: [:edit, :update]
  before_action :find_server_by_id,   only: [:show, :destroy]

  def index
    respond_to do |format|
      format.html
      format.json do
        @servers      = Server.select(:id, :name, :server_type_id, :status, :location).order(:id).includes(:server_type)
        # Получить список типов серверов при построении таблицы
        @server_types = ServerType.select(:id, :name).order(:id) if params[:serverTypes] == 'true'

        status_filter = case params[:statusFilter]
                          when 'atWork'
                            Server.statuses["В работе"]
                          when 'test'
                            Server.statuses["Тест"]
                          when 'inactive'
                            Server.statuses["Простой"]
                          else
                            nil
                        end

        # Применить фильтры к полученным данным, если это необходимо
        @servers = @servers.where(status: status_filter) unless status_filter.nil?
        @servers = @servers.where(server_type_id: params[:typeFilter]) unless params[:typeFilter].to_i.zero?

        data = @servers.as_json(
          include: {
            server_type: { only: :name }
          },
          except: :server_type_id
        )
        render json: { data: data, server_types: @server_types }
      end
    end
  end

  def show
    respond_to do |format|
      format.json { render json: @server.as_json(include: {
          server_type: { only: :name },
          clusters: { only: :name },
          real_server_details: {
            only: :count,
            include: {
              server_part: {
                only: :name,
                include: {
                  detail_type: {
                    only: :name
                  }
                }
              }
            }
          },
        },
        except: [:id, :created_at, :updated_at, :server_type_id, :cluster_id])
      }
    end
  end

  def new
    respond_to do |format|
      format.html do
        if ServerType.exists?
          @server = Server.new
          render :new
        else
          flash[:alert] = "Перед созданием оборудования необходимо создать \"Типы оборудования\""
          redirect_to action: :index
        end
      end
      format.json do
        render json: {
                 server_types: ServerType.select(:id, :name).order(:id),
                 detail_types: DetailType.select(:id, :name).order(:id).includes(:server_parts).as_json(include: {
                   server_parts: { only: [:id, :name] } })
               }
      end
    end
  end

  def create
    @server = Server.new(server_params)
    if @server.save
      flash[:notice] = "Данные добавлены."
      redirect_to action: :index, id: @server.id
    else
      flash.now[:alert] = "Ошибка добавления данных. #{ @server.errors.full_messages.join(", ") }"
      render :new
    end
  end

  def edit
    respond_to do |format|
      format.html
      format.json do
        server_details = @server.real_server_details.as_json(
          include: {
            server_part: {
              only: [:id, :name],
              include: {
                detail_type: { only: :name }
              }
            }
          },
          except: [:created_at, :updated_at])

        hash  = {}

        # Изменить структуру ответа на:
        # detail_type => [0: { count, id, index, ..., server_part: {}}]
        server_details.each_with_index do |detail, index|
          # Ключ - это имя типа запчасти (Дима, Память и т.д.)
          key   = detail['server_part']['detail_type']['name']
          # Проверка на существование ключа
          # Если ключа не существует в объекте hash или если это первый проход цикла,
          # то создать чистый массив, в который будут записываться комплектующие для текущего типа оборудования
          value = if !hash.key?(key) || index.zero?
                    []
                  else
                    hash[key]
                  end

          detail['server_part'].delete('detail_type')
          detail['index'] = index

          value.push(detail)

          hash[key] = value
        end

        render json: {
          server: {
            server_type:          @server.server_type.as_json(only: [:id, :name]),
            real_server_details:  hash
          },
          server_types: ServerType.select(:id, :name).order(:id),
          detail_types: DetailType.select(:id, :name).order(:id).includes(:server_parts).as_json(include: {
            server_parts: { only: [:id, :name] } })
        }
      end
    end
  end

  def update
    if @server.update_attributes(server_params)
      flash[:notice] = "Данные изменены"
      redirect_to action: :index, id: @server.id
    else
      flash.now[:alert] = "Ошибка изменения данных. #{ @server.errors.full_messages.join(", ") }"
      render :edit
    end
  end

  def destroy
    if @server.destroy
      respond_to do |format|
        format.json { render json: { full_message: "Данные удалены" }, status: :ok }
      end
    else
      respond_to do |format|
        format.json { render json: { full_message: "Ошибка. #{ @server.errors.full_messages.join(", ") }" }, status:
          :unprocessable_entity }
      end
    end
  end

  # Если у пользователя есть доступ, в ответ присылается html-код кнопки "Добавить" для создания новой записи
  # Запрос отсылается из JS файла при инициализации таблицы "Оборудование"
  def link_to_new_record
    link = create_link_to_new_record :page, Server, "/servers/new"
    respond_to do |format|
      format.json { render json: link }
    end
  end

  private

  # Разрешение изменения strong params
  def server_params
    params.require(:server).permit(
      :cluster_id,
      :server_type_id,
      :name,
      :status,
      :inventory_num,
      :serial_num,
      :location,
      real_server_details_attributes: [:id, :server_id, :server_part_id, :count, :_destroy])
  end

  # Поиск данных о типе запчасти по name
  def find_server_by_name
    @server = Server.find_by(name: params[:name])
  end

  # Поиск данных о типе запчасти по id
  def find_server_by_id
    @server = Server.find(params[:id])
  end

end
