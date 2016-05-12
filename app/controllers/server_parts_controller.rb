class ServerPartsController < ApplicationController

  before_action { |ctrl| ctrl.check_for_cancel server_parts_path }
  before_action :find_server_part_by_name, only: [:edit, :update]
  before_action :find_server_part_by_id, only: [:show, :destroy]

  def index
    @server_parts = ServerPart.all.includes(:detail_type)
  end

  def show
  end

  def new
    @server_part = ServerPart.new
  end

  def create
    @server_part = ServerPart.new(permit_params)
    if @server_part.save
      flash[:success] = "Данные добавлены"
      redirect_to action: :index
    else
      flash.now[:error] = "Ошибка добавления данных. #{ @server_part.errors.full_messages.join(", ") }"
      render :new
    end
  end

  def edit
  end

  def update
    if @server_part.update_attributes(permit_params)
      flash[:success] = "Данные изменены"
      redirect_to action: :index
    else
      flash.now[:error] = "Ошибка изменения данных. #{ @server_part.errors.full_messages.join(", ") }"
      render :edit
    end
  end

  def destroy
    if @server_part.destroy
      flash[:success] = "Данные удалены"
    else
      flash[:error] = "Ошибка удаления данных. #{ @server_part.errors.full_messages.join(", ") }"
    end
    redirect_to action: :index
  end

  private

  # Разрешение изменения strong params
  def permit_params
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
