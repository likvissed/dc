class ServerPartsController < ApplicationController

  load_and_authorize_resource

  before_action { |ctrl| ctrl.check_for_cancel server_parts_path }
  before_action :find_server_part_by_name,  only: [:edit]
  before_action :find_server_part_by_id,    only: [:show, :update, :destroy]

  def index
    respond_to do |format|
      format.html { render :index }
      format.json do
        @detail_types = DetailType.select(:id, :name) if params[:detailTypes] == 'true'
        @server_parts = ServerPart.select(:id, :name, :part_num, :detail_type_id)
        @server_parts = @server_parts.where(detail_type_id: params[:typeFilter]) unless params[:typeFilter].to_i.zero?

        data = @server_parts.as_json(include: { detail_type: { only: :name } })

        render json: { data: data, detail_types: @detail_types }
      end
    end
  end

  def show
    respond_to do |format|
        format.json { render json: @server_part.as_json(include: {
            detail_type: { only: :name }
          },
          except: [:id, :created_at, :updated_at, :detail_type_id])
        }
    end
  end

  def new
    respond_to do |format|
      format.json do
        if DetailType.exists?
          render json: { detail_types: DetailType.select(:id, :name) }, status: :ok
        else
          render json: { full_message: "Перед созданием комплектующих необходимо создать \"Типы комплектующих\"" }, status: :unprocessable_entity
        end
      end
    end
  end

  def create
    @server_part = ServerPart.new(server_part_params)
    if @server_part.save
      respond_to do |format|
        format.json { render json: { full_message: "Комплектующая добавлена" }, status: :ok }
      end
    else
      respond_to do |format|
        format.json { render json: { object: @server_part.errors, full_message: "Ошибка. #{ @server_part.errors.full_messages.join(", ") }" }, status: :unprocessable_entity }
      end
    end
  end

  def edit
    respond_to do |format|
      format.json { render json: { data: @server_part, detail_types: DetailType.select(:id, :name) }, status: :ok }
    end
  end

  def update
    if @server_part.update_attributes(server_part_params)
      respond_to do |format|
        format.json { render json: { full_message: "Комплектующая изменена" }, status: :ok }
      end
    else
      respond_to do |format|
        format.json { render json: { object: @server_part.errors, full_message: "Ошибка. #{ @server_part.errors.full_messages.join(", ") }" }, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    if @server_part.destroy
      respond_to do |format|
        format.json { render json: { full_message: "Комплектующая удалена" }, status: :ok }
      end
    else
      respond_to do |format|
        format.json { render json: { full_message: "Ошибка. #{ @server_part.errors.full_messages.join(", ") }" }, status: :unprocessable_entity }
      end
    end
  end

  # Если у пользователя есть доступ, в ответ присылается html-код кнопки "Добавить" для создания новой записи
  # Запрос отсылается из JS файла при инициализации таблицы "Контакты"
  def link_to_new_record
    link = create_link_to_new_record :modal, ServerPart, "ng-click='serverPartPage.showServerPartModal()"
    respond_to do |format|
      format.json { render json: link }
    end
  end

  private

  # Разрешение изменения strong params
  def server_part_params
    params.require(:server_part).permit(:name, :part_num, :comment, :detail_type_id)
  end

  # Поиск данных о типе запчасти по name
  def find_server_part_by_name
    @server_part = ServerPart.find_by(name: params[:name])
  end

  # Поиск данных о типе запчасти по id
  def find_server_part_by_id
    @server_part = ServerPart.find(params[:id])
  end

end
