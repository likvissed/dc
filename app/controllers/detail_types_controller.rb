class DetailTypesController < ApplicationController

  before_action { |ctrl| ctrl.check_for_cancel detail_types_path }
  before_action :find_detail_type_by_name, only: [:edit, :update]
  before_action :find_detail_type_by_id, only: [:show, :destroy]

  def index
    @detail_types = DetailType.all
  end

  def show
  end

  def new
    @detail_type = DetailType.new
  end

  def create
    @detail_type = DetailType.new(permit_params)
    if @detail_type.save
      flash[:success] = "Данные добавлены"
      redirect_to action: :index
    else
      flash.now[:error] = "Ошибка добавления данных. #{ @detail_type.errors.full_messages.join(", ") }"
      render :new
    end
  end

  def edit
  end

  def update
    if @detail_type.update_attributes(permit_params)
      flash[:success] = "Данные изменены"
      redirect_to action: :index
    else
      flash.now[:error] = "Ошибка изменения данных. #{ @detail_type.errors.full_messages.join(", ") }"
      render :edit
    end
  end

  def destroy
    if @detail_type.destroy
      flash[:success] = "Данные удалены"
    else
      flash[:error] = "Ошибка удаления данных. #{ @detail_type.errors.full_messages.join(", ") }"
    end
    redirect_to action: :index
  end

  private

  # Разрешение изменения strong params
  def permit_params
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
