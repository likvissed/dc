class ContactsController < ApplicationController

  load_and_authorize_resource
  before_action { |ctrl| ctrl.check_for_cancel contacts_path }

  def index
    respond_to do |format|
      format.html { render :index }
      format.json do
        data = Contact.all.as_json(except: [:created_at, :updated_at]).each do |s|
          s['DT_RowId'] = s['id']
          s['edit']     = "<a href='/contacts/#{s['id']}/edit' rel='nofollow' title='Редактировать'\"#{s['name']}\"?'><i class='fa fa-pencil-square-o fa-1g'></a>"
          s['del']      = "<a href='/contacts/#{s['id']}' class='text-danger' data-method='delete' rel='nofollow'
title='Удалить' data-confirm='Вы действительно хотите удалить контакт \"#{s['info']}\"?'><i class='fa fa-trash-o fa-1g'></a>"
          s.delete('id')
        end
        render json: { data: data }
      end
    end
  end

  def show

  end

  def new
    @contact = Contact.new
  end

  def create
    # Получение данных из базы Netadmin (если необходимо)
    unless params[:contact][:manually] == 1
      @user = UserIss.find_by(tn: params[:contact][:tn])

      params[:contact][:info]       = @user.fio
      params[:contact][:dept]       = @user.dept
      params[:contact][:work_num]   = @user.tel
    end

    @contact = Contact.new(contact_params)
    if @contact.save
      flash[:notice] = "Данные добавлены"
      redirect_to action: :index
    else
      flash.now[:alert] = "Ошибка добавления данных. #{ @contact.errors.full_messages.join(", ") }"
      render :new
    end
  end

  def edit
    @contact = Contact.find(params[:id])
  end

  def update
  end

  def destroy

  end

  def contact_params
    params.require(:contact).permit(:tn, :info, :dept, :work_num, :mobile_num, :manually)
  end

end
