class DetailTypesController < ApplicationController

  load_and_authorize_resource

  before_action { |ctrl| ctrl.check_for_cancel detail_types_path }
  before_action :find_detail_type_by_name,  only: [:edit]
  before_action :find_detail_type_by_id,    only: [:update, :destroy]

  def index
    respond_to do |format|
      format.json { render json: DetailType.select(:id, :name) }
    end
  end

  def create
    @detail_type = DetailType.new(detail_type_params)
    if @detail_type.save
      respond_to do |format|
        format.json { render json: { detail_type: @detail_type, full_message: "Тип комплектующей добавлен" }, status: :created }
      end
    else
      respond_to do |format|
        format.json { render json: { object: @detail_type.errors, full_message: "Ошибка. #{ @detail_type.errors.full_messages.join(", ") }" }, status: :unprocessable_entity }
      end
    end
  end

  def edit
    respond_to do |format|
      format.json { render json: @detail_type }
    end
  end

  def update
    if @detail_type.update_attributes(detail_type_params)
      respond_to do |format|
        format.json { render json: { detail_type: @detail_type, full_message: "Тип комплектующей изменен" }, status: :ok }
      end
    else
      respond_to do |format|
        format.json { render json: { object: @detail_type.errors, full_message: "Ошибка. #{ @detail_type.errors.full_messages.join(", ") }" }, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    if @detail_type.destroy
      respond_to do |format|
        format.json { render json: { full_message: "Данные удалены" }, status: :ok }
      end
    else
      respond_to do |format|
        format.json { render json: { full_message: "Ошибка. #{ @detail_type.errors.full_messages.join(", ") }" }, status: :unprocessable_entity }
      end
    end
  end

  # Если у пользователя есть доступ, в ответ присылается html-код кнопки "Добавить" для создания новой записи
  # Запрос отсылается из JS файла при инициализации таблицы "Типы деталей"
  def link_to_new_record
    link = create_link_to_new_record :modal, Contact, "ng-click='detailTypePage.showDetailTypeModal()"
    respond_to do |format|
      format.json { render json: link }
    end
  end

  private

  # Разрешение изменения strong params
  def detail_type_params
    params.require(:detail_type).permit(:name)
  end

  # Поиск данных о типе запчасти по name
  def find_detail_type_by_name
    @detail_type = DetailType.find_by(name: params[:name])
  end

  # Поиск данных о типе запчасти по id
  def find_detail_type_by_id
    @detail_type = DetailType.find(params[:id])
  end

end
