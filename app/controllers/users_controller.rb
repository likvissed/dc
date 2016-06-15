class UsersController < ApplicationController

  load_and_authorize_resource

  before_action { |ctrl| ctrl.check_for_cancel users_path }
  before_action :find_user_by_name, only: [:edit, :update]
  before_action :find_user_by_id,   only: [:show, :destroy]
  before_action :select_all_roles,  only: [:new, :edit]

  def index
    @users = User.select(:id, :username).page params[:page]
  end

  def show
  end

  def new
    @user = User.new
  end

  def create
    @user = User.new(user_params)
    if @user.save
      roles_params.each { |role, value| @user.add_role role if value.to_i == 1 }

      flash[:notice] = "Пользователь создан."
      redirect_to users_path
    else
      @roles  = Role.select(:name)
      flash.now[:alert] = "Ошибка создания пользователя. #{ @user.errors.full_messages.join(", ") }"
      render action: :new
    end
  end

  def edit
  end

  def update
    params[:user].delete(:password) if params[:user][:password].blank?
    params[:user].delete(:password_confirmation) if params[:user][:password].blank? and params[:user][:password_confirmation].blank?
    if @user.update_attributes(user_params)
      @user.roles = []
      roles_params.each { |role, value| @user.add_role role if value.to_i == 1 }

      flash[:notice] = "Данные изменены."
      redirect_to users_path
    else
      select_all_roles
      flash.now[:alert] = "Ошибка изменения данных. #{ @user.errors.full_messages.join(", ") }"
      render :edit
    end
  end

  def destroy
    @user.roles = []
    if @user.destroy
      flash[:notice] = "Пользователь удален."
    else
      flash[:alert] = "Ошибка удаления пользователя. #{ @user.errors.full_messages.join(", ") }"
    end
    redirect_to users_path
  end

  private

  # Разрешение strong params
  def user_params
    params.require(:user).permit(:username, :password, :password_confirmation)
  end

  def roles_params
    params.require(:roles).permit(User::ROLES)
  end

  # Поиск данных о типе запчасти по name
  def find_user_by_name
    @user = User.find_by(username: params[:name])
  end

  # Поиск данных о пользователе по id
  def find_user_by_id
    @user = User.find(params[:id])
  end

  def select_all_roles
    @roles = Role.all
  end

end
