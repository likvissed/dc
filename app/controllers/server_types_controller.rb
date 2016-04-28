class ServerTypesController < ApplicationController

  before_action :check_for_cancel, only: [:create, :update]
  before_action :find_server_type, only: [:edit, :show, :update, :destroy]

  def index
    @server_types = ServerType.all
  end

  def show
  end

  def new
    respond_to do |format|
      format.html do
        @server_type = ServerType.new
        render :new
      end
      format.json do
        server_parts = ServerPart.all
        render json: server_parts
      end
    end
  end

  def create
    @server_type = ServerType.new(permit_params)
    respond_to do |format|
      if @server_type.save
        flash[:success] = "Данные добавлены."
        format.html { redirect_to action: :index }
      else
        flash.now[:error] = "Ошибка добавления данных. #{ @server_type.errors.full_messages }."
        format.html { render :new }
      end
    end
  end

  def edit
    respond_to do |format|
      format.html do
        render :edit
      end
      format.json do
        detail_type   = @server_type.template_server_details
        server_parts  = ServerPart.all
        render json: { detail_types: detail_type.as_json(include: :server_part) , server_parts: server_parts }
      end
    end
  end

  def update
    if @server_type.update_attributes(permit_params)
      flash[:success] = "Данные изменены"
      redirect_to action: :index
    else
      flash.now[:error] = "Ошибка изменения данных. #{ @server_type.errors.full_messages }"
      render :edit
    end
  end

  def destroy
    if @server_type.destroy
      flash[:success] = "Данные удалены"
    else
      flash[:error] = "Ошибка удаления данных. #{ @server_type.errors.full_messages }"
    end
    redirect_to action: :index
  end

  private

  # Разрешение изменения strong params
  def permit_params
    params.require(:server_type).permit(:name, template_server_details_attributes: [:id, :server_type_id, :server_part_id, :count, :_destroy])
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
