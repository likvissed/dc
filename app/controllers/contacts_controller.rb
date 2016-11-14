class ContactsController < ApplicationController

  load_and_authorize_resource

  before_action { |ctrl| ctrl.check_for_cancel contacts_path }
  before_action :find_contact_by_tn, only: [:edit, :update, :destroy]

  def index
    respond_to do |format|
      format.html
      format.json { render json: Contact.select(:tn, :info, :dept, :work_num, :mobile_num) }
    end
  end

  def create
    @contact = Contact.new(contact_params)
    if @contact.save
      respond_to do |format|
        format.json { render json: { full_message: "Контакт добавлен" }, status: :created }
      end
    else
      respond_to do |format|
        format.json { render json: { object: @contact.errors, full_message: "Ошибка. #{ @contact.errors.full_messages.join(", ") }" }, status: :unprocessable_entity }
      end
    end
  end

  def edit
    respond_to do |format|
      format.json { render json: @contact }
    end
  end

  def update
    if @contact.update_attributes(contact_params)
      respond_to do |format|
        format.json { render json: { full_message: "Данные изменены" }, status: :ok }
      end
    else
      respond_to do |format|
        format.json { render json: { object: @contact.errors, full_message: "Ошибка. #{ @contact.errors.full_messages.join(", ") }" }, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    if @contact.destroy
      respond_to do |format|
        format.json { render json: { full_message: "Контакт удален" }, status: :ok }
      end
    else
      respond_to do |format|
        format.json { render json: { full_message: "Ошибка. #{ @contact.errors.full_messages.join(", ") }" }, status: :unprocessable_entity }
      end
    end
  end

  # Если у пользователя есть доступ, в ответ присылается html-код кнопки "Добавить" для создания новой записи
  # Запрос отсылается из JS файла при инициализации таблицы "Контакты"
  def link_to_new_record
    link = create_link_to_new_record :modal, Contact, "ng-click='contactPage.showContactModal()"
    respond_to do |format|
      format.json { render json: link }
    end
  end

  private

  def contact_params
    params.require(:contact).permit(:tn, :info, :dept, :work_num, :mobile_num, :manually)
  end

  def find_contact_by_tn
    @contact = Contact.find_by(tn: params[:tn])
  end

end