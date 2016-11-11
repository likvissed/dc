class NodeRolesController < ApplicationController

  load_and_authorize_resource

  before_action :find_node_role_by_name,  only: [:edit]
  before_action :find_node_role_by_id,    only: [:update, :destroy]

  def index
    respond_to do |format|
      format.json { render json: NodeRole.select(:id, :name) }
    end
  end

  def create
    @node_role = NodeRole.new(node_role_params)
    if @node_role.save
      respond_to do |format|
        format.json { render json: { node_role: @node_role, full_message: "Тип сервера добавлен" }, status: :created }
      end
    else
      respond_to do |format|
        format.json { render json: { object: @node_role.errors, full_message: "Ошибка. #{ @node_role.errors.full_messages.join(", ") }" }, status: :unprocessable_entity }
      end
    end
  end

  def edit
    respond_to do |format|
      format.json { render json: @node_role }
    end
  end

  def update
    if @node_role.update_attributes(node_role_params)
      respond_to do |format|
        format.json { render json: { node_role: @node_role, full_message: "Тип сервера изменен" }, status: :ok }
      end
    else
      respond_to do |format|
        format.json { render json: { object: @node_role.errors, full_message: "Ошибка. #{ @node_role.errors.full_messages.join(", ") }" }, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    if @node_role.destroy
      respond_to do |format|
        format.json { render json: { full_message: "Данные удалены" }, status: :ok }
      end
    else
      respond_to do |format|
        format.json { render json: { full_message: "Ошибка. #{ @node_role.errors.full_messages.join(", ") }" }, status: :unprocessable_entity }
      end
    end
  end

  # Если у пользователя есть доступ, в ответ присылается html-код кнопки "Добавить" для создания новой записи
  # Запрос отсылается из JS файла при инициализации таблицы "Типы серверов"
  def link_to_new_record
    link = create_link_to_new_record :modal, NodeRole, "ng-click='nodeRolePage.showNodeRoleModal()"
    respond_to do |format|
      format.json { render json: link }
    end
  end

  private

  # Разрешение изменения strong params
  def node_role_params
    params.require(:node_role).permit(:name)
  end

  # Поиск данных о типе запчасти по name
  def find_node_role_by_name
    @node_role = NodeRole.find_by(name: params[:name])
  end

  # Поиск данных о типе запчасти по id
  def find_node_role_by_id
    @node_role = NodeRole.find(params[:id])
  end

end
