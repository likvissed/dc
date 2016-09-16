class DepartmentHeadsController < ApplicationController

  load_and_authorize_resource

  before_action { |ctrl| ctrl.check_for_cancel department_heads_path }
  before_action :find_contact_by_tn, only: [:edit, :update, :destroy]

  def index
    respond_to do |format|
      format.html
      format.json { render json: DepartmentHead.all.as_json(except: [:id, :created_at, :updated_at]) }
    end
  end

  def new
  end

  def create
    @department_head = DepartmentHead.new(department_head_params)
    if @department_head.save
      respond_to do |format|
        format.json { render json: { department_head: @department_head.as_json(except: [:id, :department_head_id, :created_at, :updated_at]), full_message: "Руководитель добавлен" }, status: :created }
      end
    else
      respond_to do |format|
        format.json { render json: { object: @department_head.errors, full_message: "Ошибка. #{ @department_head.errors.full_messages.join(", ") }" }, status: :unprocessable_entity }
      end
    end
  end

  def edit
    respond_to do |format|
      format.json { render json: @department_head }
    end
  end

  def update
    if @department_head.update_attributes(department_head_params)
      respond_to do |format|
        format.json { render json: { department_head: @department_head.as_json(except: [:id, :department_head_id, :created_at, :updated_at]), full_message: "Данные изменены" }, status: :ok }
      end
    else
      respond_to do |format|
        format.json { render json: { object: @department_head.errors, full_message: "Ошибка. #{ @department_head.errors.full_messages.join(", ") }" }, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    if @department_head.destroy
      respond_to do |format|
        format.json { render json: { full_message: "Руководитель удален" }, status: :ok }
      end
    else
      respond_to do |format|
        format.json { render json: { full_message: "Ошибка. #{ @department_head.errors.full_messages.join(", ") }" }, status: :unprocessable_entity }
      end
    end
  end

  # Если у пользователя есть доступ, в ответ присылается html-код кнопки "Добавить" для создания новой записи
  # Запрос отсылается из JS файла при инициализации таблицы "Руководители"
  def link_to_new_record
    link = create_link_to_new_record DepartmentHead, "ng-click='depHeadPage.showHeadModal()"
    respond_to do |format|
      format.json { render json: link }
    end
  end

  private

  def department_head_params
    params.require(:department_head).permit(:tn, :dept, :info)
  end

  def find_contact_by_tn
    @department_head = DepartmentHead.find_by(tn: params[:tn])
  end

end
