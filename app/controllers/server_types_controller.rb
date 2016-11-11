class ServerTypesController < ApplicationController

  load_and_authorize_resource

  before_action { |ctrl| ctrl.check_for_cancel servers_path }
  before_action :find_server_type_by_name,  only: [:edit, :update]
  before_action :find_server_type_by_id,    only: [:show, :destroy]

  def index
    respond_to do |format|
      format.json { render json: ServerType.select(:id, :name) }
    end
  end

  def show
    respond_to do |format|
      format.json { render json: @server_type.as_json(
        include: {
          template_server_details: {
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
        except: [:id, :created_at, :updated_at])
      }
    end
  end

  def new
    respond_to do |format|
      format.html do
        if ServerPart.exists?
          @server_type = ServerType.new
          render :new
        else
          flash[:alert] = "Перед созданием типа оборудования необходимо создать \"Комплектующие\""
          redirect_to action: :index
        end
      end
      format.json do
        render json: { detail_types: DetailType.select(:id, :name).includes(:server_parts).as_json(include: { server_parts: { only: [:id, :name] } }) }
      end
    end
  end

  def create
    @server_type = ServerType.new(server_type_params)
    if @server_type.save
      flash[:notice] = "Данные добавлены."
      redirect_to controller: :servers, action: :index
    else
      flash.now[:alert] = "Ошибка добавления данных. #{ @server_type.errors.full_messages.join(", ") }."
      render :new
    end
  end

  def edit
    respond_to do |format|
      format.html { render :edit }
      format.json do
        server_details = @server_type.template_server_details.as_json(
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
                 template_server_details: hash,
                 detail_types: DetailType.select(:id, :name).includes(:server_parts).as_json(include: { server_parts: { only: [:id, :name] } })
               }
      end
    end
  end

  def update
    if @server_type.update_attributes(server_type_params)
      flash[:notice] = "Данные изменены"
      redirect_to controller: :servers, action: :index
    else
      flash.now[:alert] = "Ошибка изменения данных. #{ @server_type.errors.full_messages.join(", ") }"
      render :edit
    end
  end

  def destroy
    if @server_type.destroy
      respond_to do |format|
        format.json { render json: { full_message: "Данные удалены" }, status: :ok }
      end
    else
      respond_to do |format|
        format.json { render json: { full_message: "Ошибка. #{ @server_type.errors.full_messages.join(", ") }" }, status: :unprocessable_entity }
      end
    end
  end

  # Если у пользователя есть доступ, в ответ присылается html-код кнопки "Добавить" для создания новой записи
  # Запрос отсылается из JS файла при инициализации таблицы "Типы оборудования"
  def link_to_new_record
    link = create_link_to_new_record :page, ServerType, "/server_types/new"
    respond_to do |format|
      format.json { render json: link }
    end
  end

  private

  # Разрешение изменения strong params
  def server_type_params
    params.require(:server_type).permit(:name, template_server_details_attributes: [:id, :server_part_id, :count,
                                                                                    :_destroy])
    #:server_type_id,
  end

  # Поиск данных о типе запчасти по name
  def find_server_type_by_name
    @server_type = ServerType.find_by(name: params[:name])
  end

  # Поиск данных о типе запчасти по id
  def find_server_type_by_id
    @server_type = ServerType.find(params[:id])
  end

end
