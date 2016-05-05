class ServersController < ApplicationController

  before_action :check_for_cancel, only: [:create, :update]
  before_action :find_server_type, only: [:show, :edit, :update, :destroy]

  def index
    @servers = Server.all
  end

  def show
  end

  def new
    respond_to do |format|
      format.html do
        @server = Server.new
        render :new
      end
      format.json do
        server_types = ServerType.all
        render json: server_types
      end
    end
  end

  def create
    @server = Server.new(permit_params)
    if @server.save
      flash[:success] = "Данные добавлены."
      redirect_to action: :index
    else
      flash.now[:error] = "Ошибка добавления данных. #{ @server.errors.full_messages }"
      render :new
    end
  end

  def edit
    respond_to do |format|
      format.html { render :edit }
      format.json do
        server_details  = @server.real_server_details
        server_parts    = ServerPart.all
        server_types    = ServerType.all
        render json: { server: @server.as_json(include: :server_type), server_details: server_details.as_json(include: :server_part), server_parts: server_parts, server_types: server_types }
      end
    end
  end

  def update
    if @server.update_attributes(permit_params)
      flash[:success] = "Данные изменены"
      redirect_to action: :index
    else
      flash.now[:error] = "Ошибка изменения данных. #{ @server.errors.full_messages }"
      render :edit
    end
  end

  def destroy
    if @server.destroy
      flash[:success] = "Данные удалены"
    else
      flash[:error] = "Ошибка удаления данных. #{ @server.errors.full_messages }"
    end
    redirect_to action: :index
  end

  private

  # Разрешение изменения strong params
  def permit_params
    params.require(:server).permit(:cluster_id, :server_type_id, :name, :inventory_num, :serial_num, :location, real_server_details_attributes: [:id, :server_id, :server_part_id, :count])
  end

  # Поиск данных о типе запчасти по id
  def find_server_type
    @server = Server.find_by(name: params[:name])
  end

  # Проверка, была ли нажата кнопка "Отмена"
  def check_for_cancel
    redirect_to servers_path if params[:cancel]
  end

end
