class ServersController < ApplicationController

  before_action :check_for_cancel, only: [:create, :update]
  before_action :find_server_type, only: [:show, :edit, :update, :destroy]

  def index
    @servers = Server.all
  end

  def show
  end

  def new
    @server = Server.new
    @server.real_server_details.build
  end

  def create
    @server = Server.new(permit_params)
    if @server.save
      flash[:success] = "Данные добавлены."
      redirect_to action: :index
    else
      flash.now[:error] = "Ошибка добавления данных. #{ @server_type.errors.full_messages }"
      render :new
    end
  end

  def edit
  end

  def update
    if @server.update_attributes(permit_params)
      flash[:success] = "Данные изменены"
      redirect_to action: :index
    else
      flash.now[:error] = "Ошибка изменения данных. #{ @server_type.errors.full_messages }"
      render :edit
    end
  end

  def destroy
    if @server.destroy
      flash[:success] = "Данные удалены"
    else
      flash[:error] = "Ошибка удаления данных. #{ @server_type.errors.full_messages }"
    end
    redirect_to action: :index
  end

  private

  # Разрешение изменения strong params
  def permit_params
    params.require(:server).permit(:serial_num, :name, :location, real_server_details_attributes: [:id, :server_part_id, :count])
  end

  # Поиск данных о типе запчасти по id
  def find_server_type
    @server_type = ServerType.find(params[:id])
  end

  # Проверка, была ли нажата кнопка "Отмена"
  def check_for_cancel
    redirect_to server_types_path if params[:cancel]
  end

end
