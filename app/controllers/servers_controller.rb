class ServersController < ApplicationController

  load_and_authorize_resource

  before_action { |ctrl| ctrl.check_for_cancel servers_path }
  before_action :find_server_by_name, only: [:edit, :update]
  before_action :find_server_by_id,   only: [:show, :destroy]

  def index
    respond_to do |format|
      format.html { render :index }
      format.json do
        if params[:server_type_val].to_i.zero?
          @servers      = Server.select(:id, :name, :server_type_id, :status, :location)
          @server_types = ServerType.select(:id, :name)
        else
          @servers = Server.select(:id, :name, :server_type_id, :status, :location).where("server_type_id = ?", params[:server_type_val])
        end

        render json: @servers.as_json(include: { server_type: { only: :name } }, except: :server_type_id)
        # render json: { data: data, server_types: @server_types }
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
            include: { server_part: { only: :name } } },
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
          flash[:alert] = "Перед созданием сервера необходимо создать \"Типы серверов\""
          redirect_to action: :index
        end
      end
      format.json { render json: { types: ServerType.select(:id, :name) } }
    end
  end

  def create
    @server = Server.new(server_params)
    if @server.save
      flash[:notice] = "Данные добавлены."
      redirect_to action: :index
    else
      flash.now[:alert] = "Ошибка добавления данных. #{ @server.errors.full_messages.join(", ") }"
      render :new
    end
  end

  def edit
    respond_to do |format|
      format.html { render :edit }
      format.json do
        render json: {
          server: @server.as_json(
            only: [],
            include: {
              server_type: { only: [:id, :name] },
              real_server_details: {
                only: [:id, :server_part_id, :count],
                include: { server_part: { except: [:created_at, :updated_at] } },
              }
            }
          ),
          parts: ServerPart.select(:id, :name),
          types: ServerType.select(:id, :name),
        }
      end
    end
  end

  def update
    if @server.update_attributes(server_params)
      flash[:notice] = "Данные изменены"
      redirect_to action: :index
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
        format.json { render json: { full_message: "Ошибка. #{ @server.errors.full_messages.join(", ") }" }, status: :unprocessable_entity }
      end
    end
  end

  # Если у пользователя есть доступ, в ответ присылается html-код кнопки "Добавить" для создания новой записи
  # Запрос отсылается из JS файла при инициализации таблицы "Контакты"
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
