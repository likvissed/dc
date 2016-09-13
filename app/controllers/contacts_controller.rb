class ContactsController < ApplicationController

  load_and_authorize_resource

  before_action { |ctrl| ctrl.check_for_cancel contacts_path }
  before_action :find_contact_by_tn, only: [:edit, :update, :destroy]
  before_action :get_user_iss_data, only: [:create, :update], unless: -> { params[:contact][:manually].to_i == 1 }

  def index
    respond_to do |format|
      format.html { render :index }
      format.json do
        data = Contact.all.as_json(except: [:created_at, :updated_at]).each do |s|
          s['DT_RowId'] = s['id']
          s['edit']     = "<a href='/contacts/#{s['tn']}/edit' class='default-color' rel='nofollow' title='Редактировать'\"#{s['info']}\"?'><i class='fa fa-pencil-square-o fa-1g'></a>"
          s['del']      = "<a href='/contacts/#{s['tn']}' class='text-danger' data-method='delete' rel='nofollow'
title='Удалить' data-confirm='Вы действительно хотите удалить контакт \"#{s['info']}\"?'><i class='fa fa-trash-o fa-1g'></a>"
          s.delete('id')
        end
        render json: { data: data }
      end
    end
  end

  def new
    @contact = Contact.new
    respond_to do |format|
      format.html
      format.js { render layout: false }
    end
  end

  def create
    @contact = Contact.new(contact_params)
    if @contact.save
      flash[:notice] = "Контакт добавлен."
      redirect_to action: :index
    else
      flash.now[:alert] = "Ошибка добавления. #{ @contact.errors.full_messages.join(", ") }"
      render :new
    end
  end

  def edit
  end

  def update
    if @contact.update_attributes(contact_params)
      flash[:notice] = "Контакт изменен."
      redirect_to action: :index
    else
      flash.now[:alert] = "Ошибка. #{ @contact.errors.full_messages.join(", ") }"
      render :edit
    end
  end

  def destroy
    if @contact.destroy
      flash[:notice] = "Контакт удален."
    else
      flash[:alert] = "Ошибка удаления. #{ @contact.errors.full_messages.join(", ") }"
    end
    redirect_to action: :index
  end

  private

  # Получение данных из базы Netadmin
  def get_user_iss_data
    @user = UserIss.find_by(tn: params[:contact][:tn])
    if @user.nil?
      @contact.errors.add(:tn, "Введите корректный табельный номер")
      flash[:alert] = "Ошибка. Введите корректный табельный номер"

      render case params[:action]
               when "create"
                 :new
               when "update"
                 :edit
             end
      return
    end

    params[:contact][:info]       = @user.fio
    params[:contact][:dept]       = @user.dept
    params[:contact][:work_num]   = @user.tel
  end

  def contact_params
    params.require(:contact).permit(:tn, :info, :dept, :work_num, :mobile_num, :manually)
  end

  def find_contact_by_tn
    @contact = Contact.find_by(tn: params[:tn])
  end

end
