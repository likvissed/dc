class ServerPartsController < ApplicationController

  before_action :check_for_cancel, only: [:create, :update]
  before_action :find_server_part, only: [:show, :edit, :update, :destroy]

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
      flash.now[:error] = "Ошибка добавления данных. #{ @server_part.errors.full_messages }"
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
      flash.now[:error] = "Ошибка изменения данных. #{ @server_part.errors.full_messages }"
      render :edit
    end
  end

  def destroy
    if @server_part.destroy
      flash[:success] = "Данные удалены"
    else
      flash[:error] = "Ошибка удаления данных. #{ @server_part.errors.full_messages }"
    end
    redirect_to action: :index
  end

  private

  # Разрешение изменения strong params
  def permit_params
    params.require(:server_part).permit(:name, :part_num, :comment, :detail_type_id)
  end

  # Поиск данных о типе запчасти по id
  def find_server_part
    @server_part = ServerPart.find_by(name: params[:name])
  end

  # Проверка, была ли нажата кнопка "Отмена"
  def check_for_cancel
    redirect_to server_parts_path if params[:cancel]
  end

end
