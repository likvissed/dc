class NodeRolesController < ApplicationController

  load_and_authorize_resource

  before_action { |ctrl| ctrl.check_for_cancel node_roles_path }
  before_action :find_node_role_by_name,  only: [:edit, :update]
  before_action :find_node_role_by_id,    only: [:show, :destroy]

  def index
    @node_roles = NodeRole.select(:name, :id)
  end

  def new
    @node_role = NodeRole.new
  end

  def create
    @node_role = NodeRole.new(node_role_params)
    if @node_role.save
      flash[:notice] = "Данные добавлены"
      redirect_to action: :index
    else
      flash.now[:alert] = "Ошибка добавления данных. #{ @node_role.errors.full_messages.join(", ") }"
      render :new
    end
  end

  def edit
  end

  def update
    if @node_role.update_attributes(node_role_params)
      flash[:notice] = "Данные изменены"
      redirect_to action: :index
    else
      flash.now[:alert] = "Ошибка изменения данных. #{ @node_role.errors.full_messages.join(", ") }"
      render :edit
    end
  end

  def destroy
    if @node_role.destroy
      flash[:notice] = "Данные удалены"
    else
      flash[:alert] = "Ошибка удаления данных. #{ @node_role.errors.full_messages.join(", ") }"
    end
    redirect_to action: :index
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
