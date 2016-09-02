class DepartmentHeadsController < ApplicationController

  load_and_authorize_resource

  before_action { |ctrl| ctrl.check_for_cancel department_heads_path }
  before_action :find_contact_by_tn, only: [:edit, :update, :destroy]
  before_action :get_user_iss_data, only: [:create, :update]

  # respond_to only: [:new, :create, :edit, :update] do |format|
  #   format.js { render layout: false }
  # end

  def index
    respond_to do |format|
      format.html
      format.json do
        data = DepartmentHead.all.as_json(except: [:created_at, :updated_at]).each do |s|
          s['DT_RowId'] = s['id']
          s['edit']     = "<a href='/department_heads/#{s['tn']}/edit' class='default-color' data-remote='true' rel='nofollow' title='Редактировать'\"#{s['name']}\"?'><i class='fa fa-pencil-square-o fa-1g'></a>"
          s['del']      = "<a href='/department_heads/#{s['tn']}' class='text-danger' data-method='delete' rel='nofollow'
title='Удалить' data-confirm='Вы действительно хотите удалить контакт \"#{s['info']}\"?'><i class='fa fa-trash-o fa-1g'></a>"
          s.delete('id')
        end
        render json: { data: data }
      end
    end
  end

  def new
    @department_head = DepartmentHead.new
    respond_to do |format|
      format.js { render layout: false }
    end
  end

  def create
    @department_head = DepartmentHead.new(department_head_params)
    respond_to do |format|
      format.js{ render layout: false }
    end
  end


  def edit
    respond_to do |format|
      format.js { render layout: false }
    end
  end

  def update
    @department_head.update_attributes(department_head_params)
    respond_to do |format|
      format.js { render layout: false }
    end
  end

  def destroy
    if @department_head.destroy
      flash[:notice] = "Контакт удален."
    else
      flash[:alert] = "Ошибка удаления. #{ @department_head.errors.full_messages.join(", ") }"
    end
    redirect_to action: :index
  end

  private

  # Получение данных из базы Netadmin
  def get_user_iss_data
    @user = UserIss.find_by(tn: params[:department_head][:tn])
    if @user.nil?
      @department_head.errors.add(:tn, "Введите корректный табельный номер")
      flash[:alert] = "Ошибка. Введите корректный табельный номер"

      respond_to do |format|
        format.js { render layout: false }
      end

      return
    end

    params[:department_head][:info] = @user.fio
    params[:department_head][:dept] = @user.dept
  end

  def department_head_params
    params.require(:department_head).permit(:tn, :dept, :info)
  end

  def find_contact_by_tn
    @department_head = DepartmentHead.find_by(tn: params[:tn])
  end

  # def send_response
  #   respond_to do |format|
  #     format.js { render layout: false }
  #   end
  # end

end
