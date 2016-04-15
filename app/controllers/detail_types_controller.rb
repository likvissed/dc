class DetailTypesController < ApplicationController

  before_action :check_for_cancel, only: [:create, :update]
  before_action :find_details_type, only: [:show, :edit, :update, :destroy]

  def index
    @detail_types = DetailType.all
  end

  def show
  end

  def new
    @detail_type = DetailType.new
  end

  def create
    @detail_type = DetailType.new(detail_params)
    if @detail_type.save
      flash[:success] = "Данные добавлены"
      redirect_to action: :index
    else
      flash.now[:error] = "Ошибка добавления данных"
      render :new
    end
  end

  def edit
  end

  def update
    if @detail_type.update_attributes(detail_params)
      flash[:success] = "Данные изменены"
      redirect_to action: :index
    else
      flash.now[:error] = "Ошибка изменения данных"
      render :edit
    end
  end

  def destroy
    if @detail_type.destroy
      flash[:success] = "Данные успешно удалены"
    else
      flash[:error] = "Ошибка удаления данных"
    end
    redirect_to action: :index
  end

  private

  # Разрешение изменения strong params
  def detail_params
    params.require(:detail_type).permit(:name)
  end

  # Поиск данных о типе запчасти по id
  def find_details_type
    @detail_type = DetailType.find(params[:id])
  end

  # Проверка, была ли нажата кнопка "Отмена"
  def check_for_cancel
    redirect_to detail_types_path if params[:cancel]
  end

end
