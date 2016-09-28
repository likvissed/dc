class ServerPartsController < ApplicationController

  load_and_authorize_resource

  before_action { |ctrl| ctrl.check_for_cancel server_parts_path }
  before_action :find_server_part_by_name,  only: [:edit, :update]
  before_action :find_server_part_by_id,    only: [:show, :destroy]

  def index
    respond_to do |format|
      format.html {render :index }
      format.json do
        if params[:detail_type_val].to_i.zero?
          @server_parts = ServerPart.select(:id, :name, :part_num, :detail_type_id)
          @detail_types = DetailType.select(:id, :name)
        else
          @server_parts = ServerPart.select(:id, :name, :part_num, :detail_type_id).where("detail_type_id = ?", params[:detail_type_val])
        end

        # data = @server_parts.as_json(include: { detail_type: { only: :name } }).each do |s|
        #   s['DT_RowId'] = s['id']
        #   s['del']      = "<a href='#{server_part_path(s['id'])}' class='text-danger' data-method='delete'
# rel='nofollow' title='Удалить' data-confirm='Вы действительно хотите удалить \"#{s['name']}\"?'><i class='fa
# fa-trash-o fa-1g'></a>"
#           s.delete('id')
#           s.delete('detail_type_id')
#         end
#         render json: { data: data, detail_types: @detail_types }

        render json: @server_parts.as_json(include: { detail_type: { only: :name } })
      end
    end
  end

  def show
    respond_to do |format|
        format.json { render json: @server_part.as_json(include: {
          detail_type: { only: :name }
        },
        except: [:id, :created_at, :updated_at, :detail_type_id]) }
    end
  end

  def new
    if DetailType.exists?
      @server_part = ServerPart.new
    else
      flash[:alert] = "Перед созданием комплектующих необходимо создать \"Типы комплектующих\""
      redirect_to action: :index
    end
  end

  def create
    @server_part = ServerPart.new(server_part_params)
    if @server_part.save
      flash[:notice] = "Данные добавлены"
      redirect_to action: :index
    else
      flash.now[:alert] = "Ошибка добавления данных. #{ @server_part.errors.full_messages.join(", ") }"
      render :new
    end
  end

  def edit
  end

  def update
    if @server_part.update_attributes(server_part_params)
      flash[:notice] = "Данные изменены"
      redirect_to action: :index
    else
      flash.now[:alert] = "Ошибка изменения данных. #{ @server_part.errors.full_messages.join(", ") }"
      render :edit
    end
  end

  def destroy
    if @server_part.destroy
      respond_to do |format|
        format.json { render json: { full_message: "Данные удалены" }, status: :ok }
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
    link = create_link_to_new_record :page, ServerPart, "/server_parts/new"
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
